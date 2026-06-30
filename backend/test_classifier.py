from transformers import pipeline

try:
    print("Loading pipeline...")
    classifier = pipeline("text-classification", model="finmigodeveloper/distilbert-transaction-classifier-lora")
    res = classifier("Starbucks coffee")
    print(res)
except Exception as e:
    print(f"Error: {e}")
