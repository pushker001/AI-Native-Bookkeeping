from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel
import io
import csv

from app.db.database import get_db
from app.db.models import JournalEntry, LineItem, Account
from app.api.auth import get_current_user_id
from app.api.auth import get_current_user
from app.db.models import User
# Define the schemas right here so they don't get lost
class ResolveRequest(BaseModel):
    account_name: str

class ReconcileRequest(BaseModel):
    starting_balance: float
    ending_balance: float

router = APIRouter()

# --- NEW DOUBLE-ENTRY PROFIT & LOSS REPORT ---
@router.get("/pnl")
def generate_pnl_report(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Generates a strict Double-Entry Profit & Loss report (Revenue vs Expenses)."""
    user_id = user.user_id
    
    # 1. Calculate Total Expenses
    # In accounting, Expenses increase when Debited. 
    expense_results = db.query(
        Account.name,
        func.sum(LineItem.amount).label("total")
    ).join(LineItem, Account.id == LineItem.account_id)\
     .join(JournalEntry, LineItem.journal_entry_id == JournalEntry.id)\
     .filter(
        JournalEntry.user_id == user_id,
        JournalEntry.status == "categorized",
        Account.account_type == "EXPENSE",
        LineItem.entry_type == "DEBIT"
    ).group_by(Account.name).all()

    # 2. Calculate Total Revenue
    # In accounting, Revenue increases when Credited.
    revenue_results = db.query(
        Account.name,
        func.sum(LineItem.amount).label("total")
    ).join(LineItem, Account.id == LineItem.account_id)\
     .join(JournalEntry, LineItem.journal_entry_id == JournalEntry.id)\
     .filter(
        JournalEntry.user_id == user_id,
        JournalEntry.status == "categorized",
        Account.account_type == "REVENUE",
        LineItem.entry_type == "CREDIT"
    ).group_by(Account.name).all()

    revenue = 0.0
    expenses = {}
    total_expenses = 0.0

    for row in revenue_results:
        revenue += float(row.total)

    for row in expense_results:
        amount = float(row.total)
        expenses[row.name] = round(amount, 2)
        total_expenses += amount

    net_profit = round(revenue - total_expenses, 2)

    return {
        "status": "success", 
        "data": {
            "revenue": round(revenue, 2),
            "expenses_breakdown": expenses,
            "total_expenses": round(total_expenses, 2),
            "net_profit": net_profit
        }
    }

# --- GET FLAGGED TRANSACTIONS ---
@router.get("/flagged")
def get_flagged_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Returns all Journal Entries that the AI flagged for human review."""
    user_id = user.user_id
    flagged = db.query(JournalEntry).filter(
        JournalEntry.status == "flagged",
        JournalEntry.user_id == user_id
    ).all()
    
    return {"status": "success", "count": len(flagged), "data": flagged}


@router.put("/resolve/{transaction_id}")
def resolve_flagged_transaction(
    transaction_id: int, 
    req: ResolveRequest, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user_id = user.user_id
    
    # 1. Find the Journal Entry
    journal_entry = db.query(JournalEntry).filter(
        JournalEntry.id == transaction_id,
        JournalEntry.user_id == user_id
    ).first()
    
    if not journal_entry:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # 2. Find the Target Account you selected
    target_account = db.query(Account).filter(
        Account.user_id == user_id, 
        Account.name == req.account_name
    ).first()
    
    if not target_account:
        raise HTTPException(status_code=400, detail=f"Account {req.account_name} not found")
        
    # 3. Find the Expense/Revenue LineItem and point it to the correct account
    checking_account = db.query(Account).filter(Account.user_id == user_id, Account.name == "Checking Account").first()
    
    target_line_item = db.query(LineItem).filter(
        LineItem.journal_entry_id == journal_entry.id,
        LineItem.account_id != checking_account.id
    ).first()

    if target_line_item:
        target_line_item.account_id = target_account.id

    # 4. Mark as resolved!
    journal_entry.status = "categorized"
    db.commit()
    
    return {"status": "success", "message": "Transaction categorized successfully!"}


@router.post("/reconcile")
def bank_reconciliation(
    req: ReconcileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user_id = user.user_id
    checking_account = db.query(Account).filter(Account.user_id == user_id, Account.name == "Checking Account").first()

    if not checking_account:
        raise HTTPException(status_code=400, detail="Checking account not found")

    credits_sum = db.query(func.sum(LineItem.amount)).filter(
        LineItem.account_id == checking_account.id, LineItem.entry_type == "CREDIT"
    ).scalar() or 0.0

    debits_sum = db.query(func.sum(LineItem.amount)).filter(
        LineItem.account_id == checking_account.id, LineItem.entry_type == "DEBIT"
    ).scalar() or 0.0

    net_change = debits_sum - credits_sum
    calculated_ending = req.starting_balance + net_change
    discrepancy = abs(calculated_ending - req.ending_balance)
    is_reconciled = discrepancy < 0.01

    return {
        "status": "success",
        "data": {
            "calculated_ending_balance": round(calculated_ending, 2),
            "user_ending_balance": round(req.ending_balance, 2),
            "discrepancy": round(discrepancy, 2),
            "is_reconciled": is_reconciled
        }
    }

# --- CPA EXPORT (CSV) ---
@router.get("/export")
def export_cpa_report(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Exports all categorized transactions as a CPA-ready CSV file."""
    user_id = user.user_id
    
    # Query all journal entries and eager load line items and their accounts
    journal_entries = db.query(JournalEntry).options(
        joinedload(JournalEntry.line_items).joinedload(LineItem.account)
    ).filter(
        JournalEntry.user_id == user_id,
        JournalEntry.status == "categorized"
    ).order_by(JournalEntry.date).all()
    
    # Create the CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header
    writer.writerow(["Date", "Description", "Source Account", "Category", "Amount", "Status"])
    
    for entry in journal_entries:
        source_account_name = "Unknown"
        category_account_name = "Unknown"
        amount = 0.0
        
        for li in entry.line_items:
            acc_name = li.account.name
            if acc_name in ["Checking Account", "Credit Card"]:
                source_account_name = acc_name
            else:
                category_account_name = acc_name
                amount = li.amount
                
        # Handle transfers (where both legs hit core checking/CC accounts)
        if category_account_name == "Unknown" and len(entry.line_items) == 2:
            category_account_name = "Credit Card (Transfer)"
            amount = entry.line_items[0].amount
            
        writer.writerow([
            entry.date,
            entry.description,
            source_account_name,
            category_account_name,
            f"{amount:.2f}",
            "Categorized"
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cpa_export.csv"}
    )