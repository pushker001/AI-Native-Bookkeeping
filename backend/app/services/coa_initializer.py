from sqlalchemy.orm import Session
from app.db.models import Account, TaxLine, AccountTaxMapping

def initialize_startup_coa(db: Session, user_id: str):
    """
    Creates a standard Chart of Accounts (COA) for a new startup user
    and maps those accounts to the correct IRS Tax Lines.
    """
    # 1. Create the standard buckets (Accounts)
    accounts_data = [
        # ASSETS
        {"name": "Checking Account", "type": "ASSET", "desc": "Primary bank account"},
        
        # LIABILITIES
        {"name": "Credit Card", "type": "LIABILITY", "desc": "Corporate credit card debt"},
        
        # REVENUE
        {"name": "SaaS Subscriptions", "type": "REVENUE", "desc": "Recurring software revenue"},
        
        # EXPENSES
        {"name": "Software Subscriptions", "type": "EXPENSE", "desc": "AWS, GitHub, Slack"},
        {"name": "Advertising", "type": "EXPENSE", "desc": "Facebook, Google Ads"},
        {"name": "Travel", "type": "EXPENSE", "desc": "Flights, Hotels"},
        {"name": "Meals & Entertainment", "type": "EXPENSE", "desc": "Client dinners"},
        {"name": "Payroll", "type": "EXPENSE", "desc": "W-2 Wages"},
    ]
    
    for acc in accounts_data:
        new_account = Account(
            user_id=user_id,
            name=acc["name"],
            account_type=acc["type"],
            description=acc["desc"]
        )
        db.add(new_account)
    
    db.commit()
    print(f"✅ Generated Chart of Accounts for User {user_id}")
    
    # In the future, we will add the TaxLine mappings here!