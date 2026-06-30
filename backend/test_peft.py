from transformers import AutoModelForSequenceClassification, AutoTokenizer
from peft import PeftModel, PeftConfig
import torch

try:
    peft_model_id = "finmigodeveloper/distilbert-transaction-classifier-lora"
    print("Loading config...")
    config = PeftConfig.from_pretrained(peft_model_id)
    print(f"Base model: {config.base_model_name_or_path}")
    
    print("Loading base model...")
    # Typically distilbert-base-uncased
    model = AutoModelForSequenceClassification.from_pretrained(config.base_model_name_or_path)
    
    print("Loading peft adapter...")
    model = PeftModel.from_pretrained(model, peft_model_id)
    
    tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)
    
    inputs = tokenizer("Starbucks coffee", return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_id = logits.argmax().item()
        print(f"Predicted class ID: {predicted_class_id}")
        if model.config.id2label:
            print(f"Label: {model.config.id2label.get(predicted_class_id, 'UNKNOWN')}")
except Exception as e:
    print(f"Error: {e}")
