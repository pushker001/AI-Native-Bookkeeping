# backend/scripts/init_db.py
import json
import chromadb
from sentence_transformers import SentenceTransformer
import os

# 1. Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "data", "irs_pub_535.json")
DB_DIR = os.path.join(BASE_DIR, "chroma_data")

def init_vector_db():
    print("Loading embedding model (this might take a second)...")
    # We use a fast, lightweight open-source embedding model
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Initializing ChromaDB...")
    # This creates a persistent database on your hard drive
    client = chromadb.PersistentClient(path=DB_DIR)
    
    # Create a "collection" (like a table in SQL)
    collection = client.get_or_create_collection(name="irs_tax_rules")
    
    print("Reading IRS rules from JSON...")
    with open(DATA_FILE, "r") as f:
        rules = json.load(f)
    
    documents = []
    ids = []
    
    for rule in rules:
        documents.append(rule["text"])
        ids.append(rule["id"])
        
    print(f"Embedding {len(documents)} rules into vectors...")
    # Convert text to numbers
    embeddings = embedding_model.encode(documents).tolist()
    
    print("Saving to database...")
    collection.upsert(
        documents=documents,
        embeddings=embeddings,
        ids=ids
    )
    
    print("✅ Success! Your IRS Vector DB is ready.")

# --- 2. NEW: THE HISTORICAL TRANSACTIONS COLLECTION ---
    print("Creating historical memory collection...")
    history_collection = client.get_or_create_collection(name="historical_transactions")
    # Mock data simulating how the company categorized expenses LAST month
    historical_transactions = [
        "AWS *AMAZON CLOUD - Categorized as: Software. Reasoning: Cloud infrastructure for our web app.",
        "APPLE STORE #441 - Categorized as: Office Supplies. Reasoning: Bought a new Macbook for the developer.",
        "UBER RIDES - Categorized as: Travel. Reasoning: Ride to the client meeting."
    ]
    print("Embedding Historical Transactions...")
    history_embeddings = embedding_model.encode(historical_transactions).tolist()
    history_collection.upsert(
        documents=historical_transactions,
        embeddings=history_embeddings,
        ids=[f"history_{i}" for i in range(len(historical_transactions))]
    )
    
    print("✅ Success! Your Dual-RAG Vector DB is ready (IRS Rules + History).")

if __name__ == "__main__":
    init_vector_db()