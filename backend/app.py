from flask import Flask, render_template, request, redirect, url_for, session, flash
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
app.secret_key = "change_this_secret_key"

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
def save_scan_history(username, orig, mask, overlay, report):
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    c.execute("""
        INSERT INTO scan_history (username, original_image, mask_image, overlay_image, report_file)
        VALUES (?, ?, ?, ?, ?)
    """, (username, orig, mask, overlay, report))
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

        hashed = generate_password_hash(password)

        try:
            conn = sqlite3.connect("users.db")
            c = conn.cursor()
            c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed))
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
        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect("users.db")
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[0], password):
            session["user"] = username
            return redirect(url_for("dashboard"))
        else:
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
        SELECT overlay_image, timestamp
        FROM scan_history
        WHERE username = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (session["user"],))
    row = c.fetchone()

    if row:
        last_image, last_time = row
    else:
        last_image, last_time = None, "No scans yet"

    conn.close()

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
            "uploads/" + report_file
        )

        image_path = "uploads/" + filename
        mask_path = "uploads/" + mask_file
        overlay_path = "uploads/" + overlay_file
        report_path = "uploads/" + report_file

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
    c.execute("""
        SELECT original_image, mask_image, overlay_image, report_file, timestamp
        FROM scan_history
        WHERE username = ?
        ORDER BY timestamp DESC
    """, (session["user"],))
    rows = c.fetchall()
    conn.close()

    return render_template("history.html", history=rows)

# ===============================
# PROFILE
# ===============================
# ===============================
# PROFILE (EDITABLE + PHOTO)
# ===============================
@app.route("/profile", methods=["GET", "POST"])
def profile():
    if "user" not in session:
        return redirect(url_for("login"))

    conn = sqlite3.connect("users.db")
    c = conn.cursor()

    # Handle profile update
    if request.method == "POST":
        full_name = request.form["full_name"]
        email = request.form["email"]
        role = request.form["role"]

        # Handle profile image upload
        profile_image_path = None
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file and file.filename != "":
                ext = os.path.splitext(file.filename)[1]
                filename = session["user"] + "_profile" + ext
                save_path = os.path.join(PROFILE_PIC_FOLDER, filename)
                file.save(save_path)

                profile_image_path = "uploads/profile_pics/" + filename

                c.execute("""
                    UPDATE users
                    SET profile_image = ?
                    WHERE username = ?
                """, (profile_image_path, session["user"]))

        # Update text fields
        c.execute("""
            UPDATE users
            SET full_name = ?, email = ?, role = ?
            WHERE username = ?
        """, (full_name, email, role, session["user"]))

        conn.commit()

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

    conn.close()

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
