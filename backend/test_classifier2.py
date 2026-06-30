from transformers import pipeline

try:
    print("Loading jonjimenez/transaction-categorization...")
    classifier = pipeline("text-classification", model="jonjimenez/transaction-categorization")
    res = classifier("Starbucks coffee")
    print(res)
except Exception as e:
    print(f"Error: {e}")
