import fitz  # This is the PyMuPDF library we just installed
import os
import json
import time
import re
import concurrent.futures
from app.ai.agent import client, MODEL_NAME

def extract_text_from_pdf(file_path: str) -> str:
    """
    Opens a PDF file and extracts all the text from it.
    """
    # 1. Check if the file actually exists to prevent crashes
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Could not find the PDF at: {file_path}")

    # 2. Create an empty string to hold our extracted text
    full_text = ""

    # 3. Open the PDF document using PyMuPDF
    pdf_document = fitz.open(file_path)

    # 4. Loop through every page in the document
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        
        # 5. Extract the text from this specific page and add it to our full_text string
        # We add a newline character (\n) so pages don't mash together
        full_text += page.get_text() + "\n"

    # 6. Close the document to free up computer memory
    pdf_document.close()

    return full_text


def parse_text_to_json(raw_text: str) -> list:
    """
    Sends the raw PDF text to the LLM and asks it to extract 
    financial transactions into a structured JSON array.
    """
    
    # 1. We create strict instructions for the AI
    system_prompt = """
    You are an expert accountant. I am going to give you raw text extracted from a messy bank statement or invoice.
    Your job is to find all the financial transactions and extract them.
    
    You MUST output your response in strict JSON format. 
    The JSON must contain a single key called "transactions", which is a list of objects.
    Each object must have exactly three keys: "date", "description", and "amount".
    
    Example Output:
    {
      "transactions": [
        {"date": "2024-01-15", "description": "AWS Cloud Hosting", "amount": 150.00}
      ]
    }
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Here is the raw text to parse:\n\n{raw_text}"}
    ]
    
    # 2. Call LLM with a hard 45-second timeout using ThreadPoolExecutor
    def call_llm():
        return client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
        )
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(call_llm)
        try:
            response = future.result(timeout=45)
        except concurrent.futures.TimeoutError:
            raise Exception("LLM API timed out after 45 seconds.")
    
    # 3. Read the AI's response
    raw_response = response.choices[0].message.content
    
    # 4. Clean off markdown backticks
    clean_json_string = raw_response.replace('```json', '').replace('```', '').strip()
    
    # 5. Parse JSON with multiple fallback strategies
    # Strategy 1: Direct parse
    try:
        parsed_data = json.loads(clean_json_string)
        return parsed_data.get("transactions", [])
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract JSON object using regex
    try:
        json_match = re.search(r'\{.*\}', clean_json_string, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group())
            return parsed_data.get("transactions", [])
    except Exception:
        pass

    # Strategy 3: Extract just the array using regex
    try:
        array_match = re.search(r'\[.*\]', clean_json_string, re.DOTALL)
        if array_match:
            return json.loads(array_match.group())
    except Exception:
        pass

    # All strategies failed — return empty list, don't crash
    print(f"   ⚠️ Could not parse JSON from this chunk. Skipping.")
    return []

def extract_all_transaction(full_text: str) -> list:
    CHUNK_SIZE = 3000
    all_transactions = []

    chunks = [full_text[i:i+CHUNK_SIZE] for i in range(0, len(full_text), CHUNK_SIZE)]

    print(f"📄 PDF has {len(full_text)} characters. Split into {len(chunks)} chunks.")
    
    for i, chunk in enumerate(chunks):
        print(f"🔄 Processing chunk {i+1} of {len(chunks)}...")
        
        try:
            # Send each chunk to your existing LLM parser
            transactions = parse_text_to_json(chunk)
            
            if transactions:
                all_transactions.extend(transactions)
                print(f"   ✅ Found {len(transactions)} transactions in this chunk.")
            else:
                print(f"   ⚠️ No transactions found in chunk {i+1}. Skipping.")
                
        except Exception as e:
            # If one chunk times out or fails, skip it and keep going
            print(f"   ❌ Chunk {i+1} failed ({e}). Skipping and continuing...")
        
        # Wait 2 seconds between chunks to respect rate limits
        if i < len(chunks) - 1:
            print(f"   ⏳ Pausing 2s before next chunk...")
            time.sleep(2)
    
    print(f"✅ Total transactions extracted: {len(all_transactions)}")
    return all_transactions

if __name__ == "__main__":
    
    # A fake, messy string that simulates what a PDF bank statement looks like
    messy_bank_text = """
    Page 1
    ACCOUNT ACTIVITY
    01/15/2025    AWS *AMAZON CLOUD    $ 450.00
    01/17/2025    GUSTO PAYROLL SVCS   $ 5,200.00
    01/18/2025    APPLE STORE #441     $ 2100.00
    End of Statement
    """
    
    try:        
        print("Sending messy text to LLM for JSON Parsing... Please wait.")
        # We pass our messy string directly into the function this time
        structured_transactions = parse_text_to_json(messy_bank_text) 
        
        print("\n--- SUCCESS! Here are the extracted transactions ---")
        for txn in structured_transactions:
            print(txn)
            
    except Exception as e:
        print(f"Oops! Error: {e}")