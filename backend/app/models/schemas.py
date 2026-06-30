from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    tx_hash: Optional[str] = None
    
class UploadResponse(BaseModel):
    message: str
    transaction_count: int
    preview: List[Transaction]
    transactions: List[Transaction] = []

class ProcessRequest(BaseModel):
    source_account_id: int
    transactions: List[Transaction]

class ProcessResponse(BaseModel):
    message: str
    total_processed: int
    results: List[Dict[str, Any]]

class ReconcileRequest(BaseModel):
    starting_balance: float
    ending_balance: float

class UserProfileUpsert(BaseModel):
    organization_name: str

class UserProfileResponse(BaseModel):
    user_id: str
    organization_name: str
    email: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    organization_name: str
    country: Optional[str] = None
    business_type: Optional[str] = None
    monthly_transactions: Optional[str] = None
class LoginRequest(BaseModel):
    email: str
    password: str

class ResolveRequest(BaseModel):
    account_name: str
    
class ReconcileRequest(BaseModel):
    starting_balance: float
    ending_balance: float
