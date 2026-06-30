# backend/app/api/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
import tempfile
import csv
import io
from app.models.schemas import Transaction, UploadResponse
from app.ai.extraction_agent import extract_text_from_pdf, parse_text_to_json, extract_all_transaction
from app.api.rate_limiter import upload_rate_limiter

router = APIRouter()

@router.post("/", response_model=UploadResponse, dependencies=[Depends(upload_rate_limiter)])
async def upload_document(file: UploadFile = File(...)):
    """Receives a CSV file, performs security validation, and parses it into structured data."""
    
    transactions = []
    
    try:
        # --- SECURITY VERIFICATION ---
        MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
        
        # 1. Validate Extension & MIME Type to prevent malicious scripts
        if not file.filename.lower().endswith('.csv') or file.content_type not in ["text/csv", "application/vnd.ms-excel"]:
            raise HTTPException(status_code=400, detail="Security Error: Only valid CSV files are allowed.")
            
        contents = await file.read()
        
        # 2. Prevent massive files from crashing memory
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")

        # --- PATH 1: The CSV Fast-Track ---
        print(f"✅ Fast-Track triggered for CSV: {file.filename}")
        
        # Use utf-8-sig to handle Excel BOM characters automatically!
        decoded_contents = contents.decode('utf-8-sig')
            
        reader = csv.DictReader(io.StringIO(decoded_contents))
        print(f"🔍 CSV Headers detected: {reader.fieldnames}")
        
        for row in reader:
            # Convert all keys in the row to lowercase and strip whitespace
            lower_row = {k.lower().strip() if k else '': str(v).strip() for k, v in row.items()}
            
            raw_amount = lower_row.get('amount', '0').replace('$', '').replace(',', '')
            txn = Transaction(
                date=lower_row.get('date', ''),
                description=lower_row.get('description', ''),
                amount=float(raw_amount) if raw_amount else 0.0
            )
            transactions.append(txn)
            
        print(f"🎯 Total transactions parsed from CSV: {len(transactions)}")
            
        # (PDF Parsing hidden for MVP)

            
        return {
            "message": "Upload & Extraction successful", 
            "transaction_count": len(transactions),
            "preview": transactions[:3],
            "transactions": transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")