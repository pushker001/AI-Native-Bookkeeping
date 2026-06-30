# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.upload import router as upload_router
from app.api.process import router as process_router
from app.api.reports import router as reports_router
from app.api.users import router as users_router

from contextlib import asynccontextmanager
from app.db.database import SessionLocal
from app.services.cache_service import load_cache_from_db
from app.db.models import MerchantCache

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Wipe stale merchant cache and reload from DB
    print("🚀 Starting up... clearing and reloading merchant cache.")
    db = SessionLocal()
    try:
        # Wipe old cache entries that may have stale IRS line format
        db.query(MerchantCache).delete()
        db.commit()
        print("🗑️ Merchant cache wiped — fresh start!")
        load_cache_from_db(db)
    finally:
        db.close()
    yield
    print("🛑 Shutting down...")

app = FastAPI(title="AI Tax Firm API", lifespan=lifespan)

import os

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

origins = [
    "http://localhost:3000",
    frontend_url,
]

# Allow the Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Depends
from app.api.auth import get_current_user_id

# Register the routes with their specific prefixes
app.include_router(upload_router, prefix="/api/upload", tags=["Ingestion"], dependencies=[Depends(get_current_user_id)])
app.include_router(process_router, prefix="/api/process", tags=["AI Engine"], dependencies=[Depends(get_current_user_id)])
app.include_router(reports_router, prefix="/api/reports", tags=["Tax Reports"], dependencies=[Depends(get_current_user_id)])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running!"}
