import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("No DB_URL found")
    exit(1)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

from app.db.models import JournalEntry, LineItem, Account, User

users = db.query(User).all()
print(f"Total Users: {len(users)}")
for u in users:
    print(f"User: {u.email} ({u.user_id})")

entries = db.query(JournalEntry).all()
print(f"\nTotal Journal Entries: {len(entries)}")
for e in entries:
    print(f"  Entry: {e.date} | {e.description} | Status: {e.status}")
    lines = db.query(LineItem).filter_by(journal_entry_id=e.id).all()
    for l in lines:
        acct = db.query(Account).filter_by(id=l.account_id).first()
        print(f"    Leg: {l.entry_type} | {l.amount} | Account: {acct.name} ({acct.account_type})")
