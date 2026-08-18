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
            user_id TEXT NOT NULL DEFAULT 'legacy_user',
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
    
    # Try to add user_id to existing advisory_history if it doesn't exist
    try:
        cursor.execute("ALTER TABLE advisory_history ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy_user'")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmer_profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            location TEXT,
            farm_size REAL,
            farm_unit TEXT DEFAULT 'Acres',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS yield_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            district TEXT NOT NULL,
            land_size REAL NOT NULL,
            paddy_type TEXT NOT NULL,
            predicted_yield_kg_per_ha REAL NOT NULL,
            total_yield_kg REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS disease_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            disease_name TEXT NOT NULL,
            disease_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fertilizer_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            agro_zone TEXT NOT NULL,
            irrigation TEXT NOT NULL,
            crop_duration TEXT NOT NULL,
            total_urea REAL,
            total_tsp REAL,
            total_mop REAL,
            total_zinc REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Try to add farm_unit to existing farmer_profiles if it doesn't exist
    try:
        cursor.execute("ALTER TABLE farmer_profiles ADD COLUMN farm_unit TEXT DEFAULT 'Acres'")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()
    print("\033[94m[SYSTEM]\033[0m SQLite Database Checked/Initialized!")

# Initialize DB on import
init_db()
