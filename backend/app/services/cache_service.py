from app.db.models import MerchantCache

# In-memory dictionary for instant lookups
_cache = {}

def load_cache_from_db(db):
    global _cache
    rows = db.query(MerchantCache).all()

    for row in rows:
        _cache[row.merchant_key] = {
            "clean_name": row.clean_name,
            "category": row.category,
            "irs_line": row.irs_line,
            "confidence": row.confidence,
            "source": row.source,
        }
    
    print(f"📦 Loaded {len(_cache)} merchants from Supabase into memory.")


def get_from_cache(merchant_key: str):
    """
    Check if we already know this merchant.
    Returns the cached dict if found, None if not.
    """
    return _cache.get(merchant_key, None)


def save_to_cache(merchant_key, clean_name, category, irs_line, confidence, source, db):
    """
    Saves a new merchant to BOTH memory and Supabase.
    """
    # 1. Save to in-memory dict (instant future lookups)
    _cache[merchant_key] = {
        "clean_name": clean_name,
        "category": category,
        "irs_line": irs_line,
        "confidence": confidence,
        "source": source,
    }
    
    # 2. Save to Supabase (survives server restarts)
    db_record = db.query(MerchantCache).filter(MerchantCache.merchant_key == merchant_key).first()
    
    if db_record:
        # Update existing record
        db_record.clean_name = clean_name
        db_record.category = category
        db_record.irs_line = irs_line
        db_record.confidence = confidence
        db_record.source = source
    else:
        # Create new record
        db_record = MerchantCache(
            merchant_key=merchant_key,
            clean_name=clean_name,
            category=category,
            irs_line=irs_line,
            confidence=confidence,
            source=source,
        )
        db.add(db_record)
        
    db.commit()
    
    print(f"   💾 Saved [{merchant_key}] to cache (memory + Supabase)")
