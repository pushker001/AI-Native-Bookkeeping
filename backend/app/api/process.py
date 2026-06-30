# backend/app/api/process.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.models.schemas import Transaction, ProcessResponse, ProcessRequest
from app.ai.orchestrator import process_transactions
from app.db.database import get_db
from app.db.models import JournalEntry, LineItem, Account
from app.api.auth import get_current_user
from app.db.models import User

router = APIRouter()

import hashlib

from app.api.auth import get_current_user_id
from app.api.rate_limiter import process_rate_limiter

@router.post("/", response_model=ProcessResponse, dependencies=[Depends(process_rate_limiter)])
async def trigger_ai_processing(
    req: ProcessRequest, 
    db: Session = Depends(get_db), # <-- 1. This opens the connection to Supabase
    user: User = Depends(get_current_user) # <-- 2. Get the authenticated user
):
    """Takes parsed transactions, runs them through the AI, and saves them to the Vault."""
    user_id = user.user_id # Extract the ID string
    try:
        # 1. Filter out duplicates BEFORE running expensive AI
        unique_transactions = []
        skipped_count = 0
        seen_hashes = set() # Track hashes we've seen in THIS file
        
        for txn in req.transactions:
            # Create a stable fingerprint locked to the user
            raw_string = f"{user_id}|{txn.date}|{txn.description}|{txn.amount}"
            tx_hash = hashlib.sha256(raw_string.encode()).hexdigest()
            
            # Check if we already processed this exact row in THIS file
            if tx_hash in seen_hashes:
                skipped_count += 1
                continue
                
            # Check if hash already exists in DB from a previous upload
            exists = db.query(JournalEntry).filter(JournalEntry.tx_hash == tx_hash).first()
            if exists:
                skipped_count += 1
            else:
                seen_hashes.add(tx_hash)
                txn.tx_hash = tx_hash
                unique_transactions.append(txn)
                
        print(f"🔄 Deduplication: Skipped {skipped_count} existing transactions. Processing {len(unique_transactions)} new ones.")
        
        if not unique_transactions:
            return {
                "message": f"Ignored {skipped_count} duplicates. No new transactions to process.",
                "total_processed": 0,
                "results": []
            }

        # 2. Run the Dual-RAG AI Engine
        categorized_results = process_transactions(unique_transactions, db)
        
        # 3. The Immutable Audit Trail (Double-Entry)
        print("Saving AI decisions to Supabase Vault...")
        
        # Grab the user's source account
        source_account = db.query(Account).filter(
            Account.id == req.source_account_id,
            Account.user_id == user_id
        ).first()
        
        if not source_account:
            raise HTTPException(status_code=400, detail="Invalid source account selected.")

        # Grab fallback accounts
        default_expense_account = db.query(Account).filter(Account.user_id == user_id, Account.account_type == "EXPENSE").first()
        default_revenue_account = db.query(Account).filter(Account.user_id == user_id, Account.account_type == "REVENUE").first()
        # Find credit card account for transfers
        credit_card_account = db.query(Account).filter(Account.user_id == user_id, Account.name == "Credit Card").first()
        checking_account = db.query(Account).filter(Account.user_id == user_id, Account.name == "Checking Account").first()
        
        for result in categorized_results:
            raw = result.get("raw_transaction", {})
            desc_lower = raw.get("description", "").lower()
            abs_amount = abs(float(raw.get("amount", 0.0)))
            
            # --- TRANSFER DETECTION LOGIC ---
            is_money_leaving = float(raw.get("amount", 0.0)) < 0
            is_transfer = any(keyword in desc_lower for keyword in ["payment", "autopay", "transfer", "brex pay", "amex pay"])
            
            if is_transfer and credit_card_account and checking_account:
                print(f"🔄 Transfer Detected: {raw.get('description')} - Bypassing AI Categorizer")
                # A payment is a transfer from Checking to Credit Card
                # DR Credit Card (Liability decreases)
                # CR Checking Account (Asset decreases)
                journal_entry = JournalEntry(
                    user_id=user_id,
                    tx_hash=raw.get("tx_hash"),
                    date=raw.get("date"),
                    description=raw.get("description"),
                    status="categorized"
                )
                db.add(journal_entry)
                db.flush()
                
                debit_leg = LineItem(
                    journal_entry_id=journal_entry.id,
                    account_id=credit_card_account.id,
                    amount=abs_amount,
                    entry_type="DEBIT"
                )
                credit_leg = LineItem(
                    journal_entry_id=journal_entry.id,
                    account_id=checking_account.id,
                    amount=abs_amount,
                    entry_type="CREDIT"
                )
                db.add(debit_leg)
                db.add(credit_leg)
                continue # Skip normal expense/revenue processing

            # --- NORMAL EXPENSE/REVENUE LOGIC ---

            # Pre-AI guard: amount sign is deterministic truth — don't let AI override it
            if not is_money_leaving and source_account.account_type == "ASSET":
                # Positive amount into a checking account = Revenue, bypass AI entirely
                print(f"💰 Revenue Detected: {raw.get('description')} — routing to SaaS Subscriptions")
                target_account = default_revenue_account
            else:
                predicted_account_name = result.get("account_name", "Software Subscriptions")
                target_account = db.query(Account).filter(
                    Account.user_id == user_id,
                    Account.name == predicted_account_name
                ).first()

                # Smart fallback: if AI returned an unknown account name
                if not target_account:
                    target_account = default_expense_account if is_money_leaving else default_revenue_account
                    print(f"⚠️ Account '{predicted_account_name}' not found — falling back to {'EXPENSE' if is_money_leaving else 'REVENUE'} default")
            
            # 1. Create the Receipt Header
            journal_entry = JournalEntry(
                user_id=user_id,
                tx_hash=raw.get("tx_hash"),
                date=raw.get("date"),
                description=raw.get("description"),
                status=result.get("status", "categorized")
            )
            db.add(journal_entry)
            db.flush() # Force PostgreSQL to generate the ID so we can attach the legs!

            # 2. Create the Legs (Debits and Credits)
            
            # The direction of the flow is strictly dictated by whether money 
            # is entering (> 0) or leaving (< 0) the source account.
            
            debit_leg = LineItem(
                journal_entry_id=journal_entry.id,
                account_id=target_account.id if is_money_leaving else source_account.id,
                amount=abs_amount,
                entry_type="DEBIT"
            )

            credit_leg = LineItem(
                journal_entry_id=journal_entry.id,
                account_id=source_account.id if is_money_leaving else target_account.id,
                amount=abs_amount,
                entry_type="CREDIT"
            )

            db.add(debit_leg)
            db.add(credit_leg)
            
        # Push all records to Supabase securely
        db.commit()
        print("✅ Successfully saved to Supabase!")
        
        return {
            "message": f"Processing complete. Ignored {skipped_count} duplicates.",
            "total_processed": len(categorized_results),
            "results": categorized_results
        }
    except Exception as e:
        import traceback
        import logging
        # Log internally only — never expose stack trace to client
        logging.error("AI Processing Error:\n" + traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal error occurred during processing. Please try again.")