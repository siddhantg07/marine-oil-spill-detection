import sqlite3
from werkzeug.security import generate_password_hash
import os

DB_NAME = "users.db"
PASSWORD = "password123"

def reset_passwords():
    if not os.path.exists(DB_NAME):
        print(f"Database {DB_NAME} not found in current directory.")
        return

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        hashed_password = generate_password_hash(PASSWORD)
        
        # Update admin
        print("Resetting 'admin' password...")
        c.execute("UPDATE users SET password = ? WHERE username = 'admin'", (hashed_password,))
        if c.rowcount == 0:
            print("User 'admin' not found, creating...")
            c.execute("INSERT INTO users (username, password) VALUES ('admin', ?)", (hashed_password,))
        else:
            print("User 'admin' password updated.")

        # Create/Update testuser
        print("Resetting 'testuser' password...")
        c.execute("UPDATE users SET password = ? WHERE username = 'testuser'", (hashed_password,))
        if c.rowcount == 0:
            print("User 'testuser' not found, creating...")
            c.execute("INSERT INTO users (username, password) VALUES ('testuser', ?)", (hashed_password,))
        else:
            print("User 'testuser' password updated.")

        conn.commit()
        conn.close()
        print(f"Success! Passwords for 'admin' and 'testuser' set to: {PASSWORD}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_passwords()
