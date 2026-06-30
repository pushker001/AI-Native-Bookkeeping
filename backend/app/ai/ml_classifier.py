"""
HuggingFace ML Classifier.
Uses a parameter-efficient fine-tuned (PEFT/LoRA) model for highly accurate financial classification.
"""

import os
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from peft import PeftModel, PeftConfig

print("🤖 Loading Base Model & Financial LoRA Adapter...")
peft_model_id = "finmigodeveloper/distilbert-transaction-classifier-lora"
config = PeftConfig.from_pretrained(peft_model_id)

# 1. Load the base model and tokenizer
tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)
base_model = AutoModelForSequenceClassification.from_pretrained(config.base_model_name_or_path)

# 2. Attach the financial LoRA adapter
model = PeftModel.from_pretrained(base_model, peft_model_id)
print("🤖 Financial Classifier Ready!")

def classify_transaction(merchant_name: str) -> dict:
    """
    Takes a cleaned merchant name and returns the category + confidence.
    """
    # 1. Convert text to tokens
    inputs = tokenizer(merchant_name, return_tensors="pt")
    
    # 2. Run it through the neural network
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        
        # 3. Get the prediction and calculate confidence
        predicted_class_id = logits.argmax().item()
        probabilities = torch.softmax(logits, dim=-1)
        confidence = probabilities[0][predicted_class_id].item()
        
        # 4. Convert ID back to human-readable text
        category = model.config.id2label.get(predicted_class_id, "Unknown")
        
    return {
        "category": category,
        "confidence": round(confidence, 4)
    }