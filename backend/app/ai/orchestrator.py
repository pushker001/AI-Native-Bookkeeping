import json
import uuid
import os
import chromadb
import re
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from app.models.schemas import Transaction
from app.ai.agent import client, MODEL_NAME, tools
from app.ai.prompts import SYSTEM_PROMPT
from app.services.cache_service import get_from_cache, save_to_cache
from app.ai.ml_classifier import classify_transaction
from app.ai.irs_mapping import map_to_irs
from sqlalchemy.orm import Session

# --- 1. Initialize Vector Database ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "chroma_data")

print("Loading embedding model for Orchestrator...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path=DB_DIR)
collection = chroma_client.get_collection(name="irs_tax_rules")
history_collection = chroma_client.get_collection(name="historical_transactions")

def expand_query(cryptic_description: str) -> str:
    """
    Mini-Agent: Translates cryptic bank acronyms into semantic English 
    so the Vector Database can actually find a match.
    """
    system_prompt = """
    You are a financial acronym translator. 
    I will give you a raw bank statement description.
    Your job is to guess what company it is and what they sell.
    Keep your answer under 10 words.
    
    Example Input: WFM *AMZN
    Example Output: Amazon Web Services Cloud Hosting
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": cryptic_description}
            ]
        )
        expanded_text = response.choices[0].message.content.strip()
        print(f"🔍 Expander: [{cryptic_description}] -> [{expanded_text}]")
        return expanded_text
    except Exception as e:
        # If the LLM fails, just return the original text as a fallback
        return cryptic_description

def retrieve_dual_context(expanded_description: str) -> dict:
    """Queries BOTH ChromaDB collections using the expanded string."""
    query_embedding = embedding_model.encode([expanded_description]).tolist()
    
    # 1. Get Tax Rules
    irs_results = collection.query(query_embeddings=query_embedding, n_results=1)
    best_rule = irs_results['documents'][0][0] if irs_results['documents'] and irs_results['documents'][0] else "No specific rule found."
        
    # 2. Get Historical Context
    history_results = history_collection.query(query_embeddings=query_embedding, n_results=1)
    best_history = history_results['documents'][0][0] if history_results['documents'] and history_results['documents'][0] else "No past history found."
    
    return {
        "rule": best_rule,
        "history": best_history
    }

def categorize_transaction(transaction: Transaction, transaction_id: str, db: Session) -> Dict[str, Any]:
    # 1. Clean the merchant name
    clean_name = clean_merchant_name(transaction.description)
    merchant_key = clean_name.split()[0] if clean_name else "UNKNOWN" # Use first word as key
    
    # 2. Check the cache
    cached_result = get_from_cache(merchant_key)
    if cached_result:
        print(f"⚡ Cache HIT: [{merchant_key}] — skipping ML/LLM")
        return {
            "transaction_id": transaction_id,
            "status": "categorized",
            "account_name": cached_result["irs_line"],
            "reasoning": f"Matched from cache (Category: {cached_result['category']})",
            "confidence": cached_result["confidence"],
            "raw_transaction": transaction.model_dump()
        }

    print(f"🆕 Cache MISS: [{merchant_key}] — trying ML model...")
    
    # 3. Try the local ML Classifier
    try:
        ml_result = classify_transaction(clean_name)
        category = ml_result["category"]
        confidence = ml_result["confidence"]
        
        if confidence >= 0.80:
            category_to_bucket = {
                "Food & Dining": "Meals & Entertainment",
                "Travel": "Travel",
                "Advertising": "Advertising",
                "Software": "Software Subscriptions",
                "Payroll": "Payroll",
                "Income": "SaaS Subscriptions",
                "Revenue": "SaaS Subscriptions",
            }
            bucket_name = category_to_bucket.get(category, "Software Subscriptions")
            
            # Save to cache for next time
            save_to_cache(merchant_key, clean_name, category, bucket_name, confidence, "ml_model", db)
            
            return {
                "transaction_id": transaction_id,
                "status": "categorized",
                "account_name": bucket_name,
                "reasoning": f"Classified by ML as {category}",
                "confidence": confidence,
                "raw_transaction": transaction.model_dump()
            }
        else:
            print(f"⚠️ ML Confidence low ({confidence}). Falling back to LLM...")
    except Exception as e:
        print(f"⚠️ ML Classifier failed ({e}). Falling back to LLM...")

    # 4. Fallback to existing LLM logic
    expanded_desc = expand_query(transaction.description)
    context = retrieve_dual_context(expanded_desc)
    
    user_content = f"""
    Categorize this transaction:
    Date: {transaction.date}
    Original Description: {transaction.description}
    AI Guessed Meaning: {expanded_desc}
    Amount: ${transaction.amount}
    
    ---
    RELEVANT IRS RULES FOR THIS TRANSACTION:
    {context['rule']}
    
    HOW THIS COMPANY CATEGORIZED SIMILAR EXPENSES LAST MONTH:
    {context['history']}
    ---
    """
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        choice = response.choices[0]
        
        if choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)
            
            if function_name == "assign_account_category":
                account_name = arguments.get("account_name")
                confidence = arguments.get("confidence")
                # Attempt to save LLM result to cache
                save_to_cache(merchant_key, clean_name, "LLM Categorized", account_name, confidence, "llm", db)
                return {
                    "transaction_id": transaction_id,
                    "status": "categorized",
                    "account_name": account_name,
                    "reasoning": arguments.get("reasoning"),
                    "confidence": confidence,
                    "raw_transaction": transaction.model_dump()
                }
            elif function_name == "flag_for_human_review":
                return {
                    "transaction_id": transaction_id,
                    "status": "flagged",
                    "ambiguity_reason": arguments.get("ambiguity_reason"),
                    "raw_transaction": transaction.model_dump()
                }
                
        return {
            "transaction_id": transaction_id,
            "status": "flagged",
            "ambiguity_reason": "Model failed to categorize or use tools properly.",
            "raw_transaction": transaction.model_dump()
        }
    except Exception as e:
        return {
            "transaction_id": transaction_id,
            "status": "flagged",
            "ambiguity_reason": f"API Error: {str(e)}",
            "raw_transaction": transaction.model_dump()
        }

def clean_merchant_name(raw_description:str):
    cleaned = raw_description.upper()
    
    # 1. Remove reference codes (REF#46048, REF#14165)
    cleaned = re.sub(r'REF#\S+', '', cleaned)
    
    # 2. Remove invoice numbers (INV-5012, INV-1488)
    cleaned = re.sub(r'INV-\S+', '', cleaned)
    
    # 3. Remove store numbers (STORE #441, STORE # 234)
    cleaned = re.sub(r'STORE\s*#?\s*\d*', '', cleaned)
    
    # 4. Remove phone numbers (650-543-4800)
    cleaned = re.sub(r'\d{3}-\d{3}-\d{4}', '', cleaned)
    
    # 5. Remove standalone hash numbers (#23434)
    cleaned = re.sub(r'#\d+', '', cleaned)
    
    # 6. Remove 2-letter state codes at the end (CA, WA, NY)
    cleaned = re.sub(r'\b[A-Z]{2}\b$', '', cleaned.strip())
    
    # 7. Remove common transaction type prefixes
    prefixes = [
        'POS PURCHASE', 'ACH DEBIT', 'ACH CREDIT', 
        'WIRE TRANSFER', r'PAYPAL \*', r'SQ \*',
        r'TST\*', 'POS DEBIT'
    ]
    for prefix in prefixes:
        cleaned = re.sub(rf'^{prefix}\s*', '', cleaned.strip())
    
    # 8. Clean up extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned

def process_transactions(transactions: List[Transaction], db: Session) -> List[Dict[str, Any]]:
    """Execution loop to process a batch of transactions."""
    results = []
    for txn in transactions:
        txn_id = str(uuid.uuid4())
        result = categorize_transaction(txn, txn_id, db)
        results.append(result)
        
    return results