import sqlite3

try:
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # Add new columns to fertilizer_history
    cursor.execute('ALTER TABLE fertilizer_history ADD COLUMN irrigation TEXT;')
    cursor.execute('ALTER TABLE fertilizer_history ADD COLUMN total_zinc REAL;')
    conn.commit()
    print("Database altered successfully")
except Exception as e:
    print(f"Error altering database: {e}")
finally:
    if conn:
        conn.close()
