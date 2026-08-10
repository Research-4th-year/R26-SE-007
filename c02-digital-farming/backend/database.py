import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'history.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS advisory_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            field_id TEXT NOT NULL,
            district TEXT NOT NULL,
            city TEXT NOT NULL,
            zone TEXT NOT NULL,
            season TEXT NOT NULL,
            predicted_variety TEXT NOT NULL,
            suitability_score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()
