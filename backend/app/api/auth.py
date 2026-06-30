import os
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db.database import get_db
from app.db.models import User
from app.services.coa_initializer import initialize_startup_coa

load_dotenv()

security = HTTPBearer()
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")

def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Accepts the NextAuth session token.
    NextAuth sends token.sub (the user UUID) as the Bearer token.
    We try to decode it as a JWT first; if it's just a plain UUID, we wrap it.
    """
    token = credentials.credentials
    try:
        # Try to decode as a signed JWT (future-proof for when we pass full JWTs)
        decoded = jwt.decode(
            token,
            NEXTAUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return decoded
    except Exception:
        # If it's not a JWT (it's a plain UUID), wrap it in a dict so the rest works
        if len(token) == 36 and token.count("-") == 4:  # UUID format check
            return {"sub": token}
        raise HTTPException(status_code=401, detail="Invalid authentication token.")



def get_current_user_id(decoded_token: dict = Depends(get_current_user_claims)) -> str:
    """Returns the user UUID from the verified JWT."""
    return decoded_token.get("sub")

def get_current_user(
    decoded_token: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
) -> User:
    """
    Just-In-Time User Sync.
    Intercepts the token, checks if the user exists in PostgreSQL,
    and silently creates them (with their accounting buckets) if they don't!
    """
    user_id = decoded_token.get("sub")
    email = decoded_token.get("email", "unknown@user.com")

    # 1. Check if user exists by UUID
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        # 2. Check if they exist by email (orphaned account)
        existing_email_user = db.query(User).filter(User.email == email).first()

        if existing_email_user:
            print(f"🔒 JIT AUTH: Relinking {email} to new ID...")
            existing_email_user.user_id = user_id
            db.commit()
            db.refresh(existing_email_user)
            return existing_email_user

        # 3. Brand new user — create them instantly!
        print(f"🔒 JIT AUTH: Registering new user {email}...")
        user = User(
            user_id=user_id,
            email=email,
            organization_name="New Startup"
        )
        db.add(user)
        db.flush()
        initialize_startup_coa(db, user_id=user_id)
        db.commit()
        db.refresh(user)

    return user