# backend/app/ai/agent.py
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Initialize OpenAI client pointed to OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "dummy_key")
)

# We are using a free Llama 3 model for the MVP
MODEL_NAME = "openai/gpt-oss-120b:free"

# Define the tools the AI can use to categorize or flag transactions
tools = [
        {
        "type": "function",
        "function": {
            "name": "assign_account_category",
            "description": "Categorize a business transaction into a specific Chart of Accounts bucket.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transaction_id": {
                        "type": "string",
                        "description": "The unique ID of the transaction."
                    },
                    "account_name": {
                        "type": "string",
                        "description": "The exact name of the account bucket (e.g., 'Software Subscriptions', 'Travel')."
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "A short explanation of why this bucket was chosen."
                    },
                    "confidence": {
                        "type": "number",
                        "description": "A confidence score between 0.0 and 1.0."
                    }
                },
                "required": ["transaction_id", "account_name", "reasoning", "confidence"]
            }
        }
    },
]