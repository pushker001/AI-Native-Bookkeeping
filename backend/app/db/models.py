from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    organization_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    country = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    monthly_transactions = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"), index=True, nullable=False)
    
    name = Column(String, nullable=False) # e.g., "Software Subscriptions"
    account_type = Column(String, nullable=False) # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    line_items = relationship("LineItem", back_populates="account")

class MerchantCache(Base):
    __tablename__ = "merchant_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_key = Column(String, unique=True, index=True)  # "STARBUCKS" (the cleaned name, used for lookup)
    clean_name = Column(String)                              # "Starbucks Corporation" (human-readable)
    category = Column(String)                                # "Food & Dining" (from ML model)
    irs_line = Column(String, nullable=True)                 # "Line 24b - Meals" (from IRS mapping)
    confidence = Column(Float, nullable=True)                # 0.97 (how sure the ML model was)
    source = Column(String, default="ml_model")              # "ml_model", "llm", or "human_override"
    created_at = Column(DateTime, default=datetime.utcnow)


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id", ondelete="CASCADE"), index=True, nullable=False)
    
    tx_hash = Column(String, unique=True, index=True) # Deterministic hash for deduplication
    date = Column(String, index=True)
    description = Column(String) # "AWS CLOUD SERVICES"
    
    status = Column(String, default="pending") # 'pending', 'reconciled', 'flagged'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    line_items = relationship("LineItem", back_populates="journal_entry", cascade="all, delete-orphan")

class LineItem(Base):
    __tablename__ = "line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), index=True, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), index=True, nullable=False)
    
    amount = Column(Float, nullable=False) # Always positive!
    entry_type = Column(String, nullable=False) # "DEBIT" or "CREDIT"
    
    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="line_items")
    account = relationship("Account", back_populates="line_items")

class TaxLine(Base):
    __tablename__ = "tax_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    form_name = Column(String, nullable=False) # "Form 1120"
    line_number = Column(String, nullable=False) # "Line 26"
    description = Column(String, nullable=False) # "Other Deductions"

class AccountTaxMapping(Base):
    __tablename__ = "account_tax_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), unique=True, nullable=False)
    tax_line_id = Column(Integer, ForeignKey("tax_lines.id"), nullable=False)
    tax_year = Column(Integer, nullable=False) # e.g., 2026
    
    # Relationships
    account = relationship("Account")
    tax_line = relationship("TaxLine")
