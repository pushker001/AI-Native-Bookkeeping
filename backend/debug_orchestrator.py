from app.ai.ml_classifier import classify_transaction
from app.ai.orchestrator import clean_merchant_name
import sys

raw_desc = "ADOBE *CREATIVE CLOUD 800-833-6687 CA"
clean_name = clean_merchant_name(raw_desc)
print(f"Clean name: {clean_name}")

try:
    res = classify_transaction(clean_name)
    print(f"ML Result: {res}")
except Exception as e:
    print(f"ML Error: {e}")
