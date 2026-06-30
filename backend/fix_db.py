import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.database import SessionLocal
from app.db.models import TransactionRecord

def fix_cc_payment():
    db = SessionLocal()
    try:
        # Find the bad credit card payment in the DB and set it to N/A
        records = db.query(TransactionRecord).filter(
            TransactionRecord.amount > 0,
            TransactionRecord.description.ilike('%PAYMENT THANK YOU%')
        ).all()
        
        for record in records:
            record.irs_line = 'N/A'
            record.reasoning = 'Credit Card Payment (Internal Transfer)'
        
        db.commit()
        print("✅ Fixed the credit card payment in the DB!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_cc_payment()
