import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from app.services.coa_initializer import initialize_startup_coa
from app.api.auth import get_current_user_claims
from app.db.database import get_db
from app.db.models import User, Account
from app.models.schemas import UserProfileResponse, UserProfileUpsert, RegisterRequest, LoginRequest
router = APIRouter()
# Password Hashing Engine
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    # 2. Hash the password and create the user
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(req.password)
    new_user = User(
        user_id=user_id,
        email=req.email.lower(),
        hashed_password=hashed_password,
        organization_name=req.organization_name,
        country=req.country,
        business_type=req.business_type,
        monthly_transactions=req.monthly_transactions
    )
    db.add(new_user)
    db.flush() # Secure the ID
    # 3. Build the Double-Entry Accounting Buckets Instantly!
    initialize_startup_coa(db, user_id=user_id)
    db.commit()
    return {"status": "success", "user_id": user_id, "email": new_user.email}

@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Verifies a user's password and returns their profile to NextAuth."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {
        "id": user.user_id, 
        "email": user.email, 
        "organization_name": user.organization_name
    }

@router.put("/me", response_model=UserProfileResponse)
def upsert_current_user(
    profile: UserProfileUpsert,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
):
    user_id = claims.get("sub")
    email = claims.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Token is missing required profile data.")
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        user.organization_name = profile.organization_name
        user.email = email
    else:
        user = User(
            user_id=user_id,
            organization_name=profile.organization_name,
            email=email,
        )
        db.add(user)
        db.flush()
        initialize_startup_coa(db, user_id=user_id)
    db.commit()
    db.refresh(user)
    return user

@router.get("/accounts")
def list_user_accounts(
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    accounts = db.query(Account).filter(
        Account.user_id == user_id,
        Account.account_type.in_(["ASSET", "LIABILITY"])
    ).all()
    
    return {
        "status": "success",
        "data": [
            {
                "id": acc.id,
                "name": acc.name,
                "type": acc.account_type,
                "description": acc.description
            }
            for acc in accounts
        ]
    }
