"""
Static mapping from ML model categories to IRS Schedule C lines.
This is a dictionary, not AI. The IRS publishes these categories publicly.
"""

CATEGORY_TO_IRS = {
    "Food & Dining":       {"irs_line": "Line 26", "description": "Other Deductions (Meals)"},
    "Travel":              {"irs_line": "Line 26", "description": "Other Deductions (Travel)"},
    "Advertising":         {"irs_line": "Line 22", "description": "Advertising"},
    "Software":            {"irs_line": "Line 26", "description": "Other Deductions (Software/Office)"},
    "Technology":          {"irs_line": "Line 26", "description": "Other Deductions (Software/Office)"},
    "Bills & Utilities":   {"irs_line": "Line 26", "description": "Other Deductions (Utilities)"},
    "Rent":                {"irs_line": "Line 16", "description": "Rents"},
    "Insurance":           {"irs_line": "Line 26", "description": "Other Deductions (Insurance)"},
    "Professional Services": {"irs_line": "Line 26", "description": "Other Deductions (Legal/Professional)"},
    "Education":           {"irs_line": "Line 26", "description": "Other Deductions (Training)"},
    "Shopping":            {"irs_line": "Line 26", "description": "Other Deductions (Supplies)"},
    "Entertainment":       {"irs_line": "Line 26", "description": "Other Deductions (Meals & Entertainment)"},
    "Transportation":      {"irs_line": "Line 26", "description": "Other Deductions (Auto)"},
    "Health & Fitness":    {"irs_line": "Line 24", "description": "Employee Benefit Programs"},
    "Income":              {"irs_line": "Line 1",  "description": "Gross Receipts"},
    "Transfer":            {"irs_line": "N/A",     "description": "Internal Transfer"},
}

def map_to_irs(category: str) -> dict:
    """
    Takes a category from the ML model and returns the IRS Form 1120 line.
    Falls back to 'Line 26' if the category is unknown.
    """
    result = CATEGORY_TO_IRS.get(category, {
        "irs_line": "Line 26",
        "description": "Other Deductions"
    })
    return result