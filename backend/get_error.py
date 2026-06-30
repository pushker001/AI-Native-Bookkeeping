import sqlite3
import json

try:
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT status, description FROM journal_entries WHERE status='error' LIMIT 1")
    row = cursor.fetchone()
    print(f"Error Row: {row}")
except Exception as e:
    print(f"Failed to query sqlite: {e}")

