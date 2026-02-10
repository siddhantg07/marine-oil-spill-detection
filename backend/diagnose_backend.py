import sqlite3
import os
import sys

# DATABASE CHECK
print("Checking Database...")
try:
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("PRAGMA table_info(scan_history)")
    columns = [row[1] for row in c.fetchall()]
    print(f"Columns in scan_history: {columns}")

    missing_cols = []
    if "result" not in columns:
        missing_cols.append("result")
    if "confidence" not in columns:
        missing_cols.append("confidence")

    if missing_cols:
        print(f"Missing columns: {missing_cols}. Attempting to fix...")
        for col in missing_cols:
            col_type = "TEXT" if col == "result" else "REAL"
            try:
                c.execute(f"ALTER TABLE scan_history ADD COLUMN {col} {col_type}")
                print(f"Added column: {col}")
            except Exception as e:
                print(f"Failed to add column {col}: {e}")
        conn.commit()
    else:
        print("Database schema looks correct.")
    conn.close()
except Exception as e:
    print(f"Database check failed: {e}")

# MODEL CHECK
print("\nChecking Model...")
MODEL_PATH = os.path.join("model", "oilspill_unet.h5")
if os.path.exists(MODEL_PATH):
    print(f"Model file found at {MODEL_PATH}")
    try:
        import tensorflow as tf
        print("Loading model...")
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
else:
    print(f"Model file NOT found at {MODEL_PATH}")

print("\nDiagnostic complete.")
