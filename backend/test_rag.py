import json
from app.models.schemas import Transaction
from app.ai.orchestrator import process_transactions

if __name__ == "__main__":
    print("--- STARTING DUAL-RAG TEST ---")
    
    # 1. Create a fake, cryptic transaction
    fake_txn = Transaction(
        date="2025-01-20",
        description="APPLE STORE #441",
        amount=2100.00
    )
    
    print(f"Testing Transaction: {fake_txn.description} for ${fake_txn.amount}")
    
    # 2. Run it through the engine
    try:
        results = process_transactions([fake_txn])
        
        print("\n--- FINAL AI DECISION ---")
        # Print the final dictionary in a pretty JSON format
        print(json.dumps(results[0], indent=2))
        
    except Exception as e:
        print(f"Oops! Something crashed: {e}")