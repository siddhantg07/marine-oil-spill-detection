from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import os
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})
app.secret_key = "change_this_secret_key"
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# ===============================
# PATHS
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
PROFILE_PIC_FOLDER = os.path.join(UPLOAD_FOLDER, "profile_pics")
os.makedirs(PROFILE_PIC_FOLDER, exist_ok=True)
MODEL_PATH = os.path.join(BASE_DIR, "model", "oilspill_unet.h5")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===============================
# LOAD MODEL
# ===============================
model = tf.keras.models.load_model(MODEL_PATH)

# ===============================
# INIT DATABASE
# ===============================
def init_db():
    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            original_image TEXT,
            mask_image TEXT,
            overlay_image TEXT,
            report_file TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ===============================
# UPGRADE USERS TABLE (SAFE)
# ===============================
def upgrade_users_table():
    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    for col in ["full_name", "email", "role", "profile_image"]:
        try:
            c.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
        except:
            pass

    conn.commit()
    conn.close()

upgrade_users_table()

# ===============================
# IMAGE PREPROCESS
# ===============================
def preprocess_image(image_path):
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (256, 256))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)
    return img

# ===============================
# CREATE OVERLAY
# ===============================
def create_overlay(image_path, mask):
    original = cv2.imread(image_path)
    original = cv2.resize(original, (mask.shape[1], mask.shape[0]))

    red_mask = np.zeros_like(original)
    red_mask[:, :, 2] = mask

    overlay = cv2.addWeighted(original, 0.7, red_mask, 0.3, 0)
    return overlay

# ===============================
# GENERATE PDF REPORT
# ===============================
def generate_pdf_report(original_img, mask_img, overlay_img, result, confidence, report_path):
    c = canvas.Canvas(report_path, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 50, "Marine Oil Spill Detection Report")

    c.setFont("Helvetica", 12)
    c.drawString(50, height - 90, "Date & Time: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 130, f"Result: {result}")
    c.drawString(50, height - 160, f"Affected Area: {confidence} %")

    c.drawString(50, height - 200, "Original Image:")
    c.drawImage(original_img, 50, height - 450, width=200, height=200)

    c.drawString(300, height - 200, "Predicted Mask:")
    c.drawImage(mask_img, 300, height - 450, width=200, height=200)

    c.showPage()

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Overlay Result:")
    c.drawImage(overlay_img, 100, height - 500, width=400, height=400)

    c.save()

# ===============================
# SAVE HISTORY
# ===============================
def save_scan_history(username, orig, mask, overlay, report, result, confidence):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    # Ensure columns exist (simple migration check)
    try:
        c.execute("ALTER TABLE scan_history ADD COLUMN result TEXT")
    except:
        pass
        
    try:
        c.execute("ALTER TABLE scan_history ADD COLUMN confidence REAL")
    except:
        pass

    c.execute("""
        INSERT INTO scan_history (username, original_image, mask_image, overlay_image, report_file, result, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (username, orig, mask, overlay, report, result, confidence))
    conn.commit()
    conn.close()

# ===============================
# AUTH ROUTES
# ===============================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        email = request.form.get("email", "")
        # Add full_name support
        full_name = request.form.get("full_name", "")

        hashed = generate_password_hash(password)

        try:
            conn = sqlite3.connect("users.db")
            c = conn.cursor()
            # Ensure email column exists (handled by upgrade_users_table)
            c.execute("INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)", (username, hashed, email, full_name))
            conn.commit()
            conn.close()
            flash("Registration successful! Please login.")
            return redirect(url_for("login"))
        except:
            flash("Username already exists!")
            return redirect(url_for("register"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            username = data.get("username")
            password = data.get("password")
        else:
            username = request.form["username"]
            password = request.form["password"]

        conn = sqlite3.connect("users.db")
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[0], password):
            session["user"] = username
            if request.is_json:
                return jsonify({"success": True, "user": username})
            return redirect(url_for("dashboard"))
        else:
            if request.is_json:
                return jsonify({"success": False, "message": "Invalid username or password"}), 401
            flash("Invalid username or password!")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# ===============================
# HOME
# ===============================
@app.route("/")
def home():
    return redirect(url_for("dashboard"))

# ===============================
# DASHBOARD
# ===============================
@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    # Total scans
    c.execute("SELECT COUNT(*) FROM scan_history WHERE username = ?", (session["user"],))
    total_scans = c.fetchone()[0]

    # Oil detected scans (ratio > 1%)
    # We infer from report existence (all scans have reports, but we can use filename logic later)
    # For now: count all scans where overlay exists AND filename contains something
    c.execute("""
        SELECT COUNT(*) FROM scan_history
        WHERE username = ?
    """, (session["user"],))
    oil_scans = c.fetchone()[0]

    # For now, no_oil = total - oil (later we can store result in DB)
    no_oil_scans = total_scans - oil_scans

    # Last scan
    c.execute("""
        SELECT overlay_image, original_image, mask_image, timestamp
        FROM scan_history
        WHERE username = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (session["user"],))
    row = c.fetchone()

    if row:
        last_image, last_original, last_mask, last_time = row
    else:
        last_image, last_original, last_mask, last_time = None, None, None, "No scans yet"

    conn.close()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", ""):
        return jsonify({
            "total_scans": total_scans,
            "oil_scans": oil_scans,
            "no_oil_scans": no_oil_scans,
            "last_image": last_image,
            "last_original": last_original,
            "last_mask": last_mask,
            "last_time": last_time
        })

    return render_template(
        "dashboard.html",
        username=session["user"],
        total_scans=total_scans,
        oil_scans=oil_scans,
        no_oil_scans=no_oil_scans,
        last_image=last_image,
        last_time=last_time
    )

# ===============================
# SCAN PAGE
# ===============================
@app.route("/scan", methods=["GET", "POST"])
def scan():
    if "user" not in session:
        return redirect(url_for("login"))

    result = confidence = image_path = mask_path = overlay_path = report_path = None

    if request.method == "POST":
        file = request.files["image"]
        if not file or file.filename == "":
            return render_template("index.html")

        filename = datetime.now().strftime("%Y%m%d_%H%M%S_") + file.filename
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)

        img = preprocess_image(save_path)
        pred = model.predict(img)[0]

        mask = (pred > 0.5).astype(np.uint8) * 255
        if len(mask.shape) == 3:
            mask = mask[:, :, 0]

        mask_file = "mask_" + filename
        mask_save_path = os.path.join(UPLOAD_FOLDER, mask_file)
        cv2.imwrite(mask_save_path, mask)

        overlay_img = create_overlay(save_path, mask)
        overlay_file = "overlay_" + filename
        overlay_save_path = os.path.join(UPLOAD_FOLDER, overlay_file)
        cv2.imwrite(overlay_save_path, overlay_img)

        ratio = np.sum(mask > 0) / mask.size
        confidence = round(ratio * 100, 2)
        result = "Oil Spill Detected" if ratio > 0.01 else "No Oil Spill Detected"

        report_file = "report_" + filename + ".pdf"
        report_save_path = os.path.join(UPLOAD_FOLDER, report_file)

        generate_pdf_report(save_path, mask_save_path, overlay_save_path, result, confidence, report_save_path)

        save_scan_history(
            session["user"],
            "uploads/" + filename,
            "uploads/" + mask_file,
            "uploads/" + overlay_file,
            "uploads/" + report_file,
            result,
            confidence
        )

        image_path = "uploads/" + filename
        mask_path = "uploads/" + mask_file
        overlay_path = "uploads/" + overlay_file
        report_path = "uploads/" + report_file

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", ""):
        return jsonify({
            "result": result,
            "confidence": confidence,
            "affected_area": confidence,
            "image_path": image_path,
            "mask_path": mask_path,
            "overlay_path": overlay_path,
            "report_path": report_path
        })

    return render_template("index.html", result=result, confidence=confidence,
                           image_path=image_path, mask_path=mask_path,
                           overlay_path=overlay_path, report_path=report_path)

# ===============================
# HISTORY
# ===============================
@app.route("/history")
def history():
    if "user" not in session:
        return redirect(url_for("login"))

    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    # Ensure columns exist for select (if upgrading old db)
    try:
        c.execute("SELECT original_image, mask_image, overlay_image, report_file, timestamp, result, confidence FROM scan_history WHERE username = ? ORDER BY timestamp DESC", (session["user"],))
    except:
        # Fallback for old db without new columns
        c.execute("SELECT original_image, mask_image, overlay_image, report_file, timestamp FROM scan_history WHERE username = ? ORDER BY timestamp DESC", (session["user"],))
    
    rows = c.fetchall()
    conn.close()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", ""):
        history_data = []
        for row in rows:
            # Handle potential missing columns in old rows if we just added them but didn't backfill
            # Row length will vary.
            item = {
                "original_image": row[0],
                "mask_image": row[1],
                "overlay_image": row[2],
                "report_file": row[3],
                "timestamp": row[4],
                "result": row[5] if len(row) > 5 else "Unknown",
                "confidence": row[6] if len(row) > 6 else 0.0,
                # In frontend we can use confidence as affected_area
                "affected_area": row[6] if len(row) > 6 else 0.0
            }
            history_data.append(item)
        return jsonify(history_data)

    return render_template("history.html", history=rows)

# ===============================
# PROFILE
# ===============================
# ===============================
# PROFILE (EDITABLE + PHOTO) - SAFE VERSION
# ===============================
@app.route("/profile", methods=["GET", "POST"])
def profile():
    if "user" not in session:
        if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", ""):
            return jsonify({"success": False, "message": "Not logged in"}), 401
        return redirect(url_for("login"))

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    if request.method == "POST":
        # Check if it's a JSON request (API)
        # Check if it's a JSON request (API)
        if request.is_json:
            data = request.get_json()
            new_username = data.get("username")
            full_name = data.get("full_name")
            email = data.get("email")
            role = data.get("role")
        else:
            # Form data
            new_username = request.form.get("username")
            full_name = request.form.get("full_name")
            email = request.form.get("email")
            role = request.form.get("role")

        current_username = session["user"]

        # Handle username change if requested
        if new_username and new_username != current_username:
            # Check if exists
            c.execute("SELECT 1 FROM users WHERE username = ?", (new_username,))
            if c.fetchone():
                conn.close()
                return jsonify({"success": False, "message": "Username already exists"}), 400
            
            # Rename profile pic if exists
            old_pic_pattern = os.path.join(PROFILE_PIC_FOLDER, current_username + "_profile.*")
            import glob
            for f in glob.glob(old_pic_pattern):
                ext = os.path.splitext(f)[1]
                new_f = os.path.join(PROFILE_PIC_FOLDER, new_username + "_profile" + ext)
                try:
                    os.rename(f, new_f)
                    # Update DB path
                    new_db_path = "uploads/profile_pics/" + new_username + "_profile" + ext
                    c.execute("UPDATE users SET profile_image = ? WHERE username = ?", (new_db_path, current_username))
                except:
                    pass

            # Update users table
            c.execute("UPDATE users SET username = ? WHERE username = ?", (new_username, current_username))
            
            # Update scan_history table (Cascade)
            c.execute("UPDATE scan_history SET username = ? WHERE username = ?", (new_username, current_username))
            
            # Update session
            session["user"] = new_username
            current_username = new_username

        # Handle profile image upload (from avatar click)
        profile_image_path = None
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file and file.filename != "":
                ext = os.path.splitext(file.filename)[1]
                filename = current_username + "_profile" + ext
                save_path = os.path.join(PROFILE_PIC_FOLDER, filename)
                file.save(save_path)
                profile_image_path = "uploads/profile_pics/" + filename

                c.execute("""
                    UPDATE users
                    SET profile_image = ?
                    WHERE username = ?
                """, (profile_image_path, current_username))

        # Update text fields
        if full_name is not None:
            c.execute("""
                UPDATE users
                SET full_name = ?, email = ?, role = ?
                WHERE username = ?
            """, (full_name, email, role, current_username))
        
        conn.commit()
        
        if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", "") or request.is_json:
             # Fetch updated user info to return
            c.execute("SELECT username, full_name, email, role, profile_image FROM users WHERE username = ?", (session["user"],))
            user = c.fetchone()
            conn.close()
            return jsonify({
                "success": True,
                "user": {
                    "username": user[0],
                    "fullName": user[1],
                    "email": user[2],
                    "role": user[3],
                    "profileImage": user[4]
                }
            })

    # Fetch user info
    c.execute("""
        SELECT username, full_name, email, role, profile_image
        FROM users
        WHERE username = ?
    """, (session["user"],))
    user = c.fetchone()

    # Stats
    c.execute("SELECT COUNT(*) FROM scan_history WHERE username = ?", (session["user"],))
    total_scans = c.fetchone()[0]

    c.execute("""
        SELECT timestamp FROM scan_history
        WHERE username = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (session["user"],))
    row = c.fetchone()
    last_scan = row[0] if row else "No scans yet"
    
    # Calculate member since (approximate via first scan or just static for now if not in DB)
    # We can add created_at to users table later. For now, let's try to find first scan.
    c.execute("SELECT timestamp FROM scan_history WHERE username = ? ORDER BY timestamp ASC LIMIT 1", (session["user"],))
    first_scan_row = c.fetchone()
    member_since = first_scan_row[0] if first_scan_row else "New Member"

    conn.close()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", ""):
        return jsonify({
            "fullName": user[1] if user[1] else "",
            "email": user[2] if user[2] else "",
            "username": user[0],
            "role": user[3] if user[3] else "User",
            "profileImage": user[4],
            "stats": {
                "totalScans": total_scans,
                "lastScanDate": last_scan,
                "memberSince": member_since
            }
        })

    return render_template(
        "profile.html",
        user=user,
        total_scans=total_scans,
        last_scan=last_scan
    )

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
