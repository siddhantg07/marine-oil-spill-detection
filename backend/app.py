from flask import Flask, render_template, request
import tensorflow as tf
import numpy as np
import cv2
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime

app = Flask(__name__)

# ===============================
# PATHS
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
MODEL_PATH = os.path.join(BASE_DIR, "model", "oilspill_unet.h5")  # 🔴 CHANGE NAME IF NEEDED

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===============================
# LOAD MODEL
# ===============================
model = tf.keras.models.load_model(MODEL_PATH)

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
def generate_pdf_report(original_img, mask_img, overlay_img, result, confidence):
    report_path = os.path.join(UPLOAD_FOLDER, "report.pdf")

    c = canvas.Canvas(report_path, pagesize=A4)
    width, height = A4

    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 50, "Marine Oil Spill Detection Report")

    # Date
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 90, "Date & Time: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    # Result
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 130, f"Result: {result}")
    c.drawString(50, height - 160, f"Affected Area: {confidence} %")

    # Images page 1
    c.drawString(50, height - 200, "Original Image:")
    c.drawImage(original_img, 50, height - 450, width=200, height=200)

    c.drawString(300, height - 200, "Predicted Mask:")
    c.drawImage(mask_img, 300, height - 450, width=200, height=200)

    c.showPage()

    # Page 2
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Overlay Result:")

    c.drawImage(overlay_img, 100, height - 500, width=400, height=400)

    c.save()

    return report_path

# ===============================
# ROUTE
# ===============================
@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    confidence = None
    image_path = None
    mask_path = None
    overlay_path = None
    report_path = None

    if request.method == "POST":
        if "image" not in request.files:
            return render_template("index.html")

        file = request.files["image"]
        if file.filename == "":
            return render_template("index.html")

        # ===============================
        # SAVE IMAGE
        # ===============================
        save_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(save_path)

        # ===============================
        # PREDICT
        # ===============================
        img = preprocess_image(save_path)
        pred = model.predict(img)[0]

        mask = (pred > 0.5).astype(np.uint8) * 255
        if len(mask.shape) == 3:
            mask = mask[:, :, 0]
        mask = mask.astype(np.uint8)

        # ===============================
        # SAVE MASK
        # ===============================
        mask_file = "mask_" + file.filename
        mask_save_path = os.path.join(UPLOAD_FOLDER, mask_file)
        cv2.imwrite(mask_save_path, mask)

        # ===============================
        # SAVE OVERLAY
        # ===============================
        overlay_img = create_overlay(save_path, mask)
        overlay_file = "overlay_" + file.filename
        overlay_save_path = os.path.join(UPLOAD_FOLDER, overlay_file)
        cv2.imwrite(overlay_save_path, overlay_img)

        # ===============================
        # CALCULATE AREA
        # ===============================
        oil_pixels = np.sum(mask > 0)
        total_pixels = mask.size
        ratio = oil_pixels / total_pixels
        confidence = round(ratio * 100, 2)

        if ratio > 0.01:
            result = "Oil Spill Detected"
        else:
            result = "No Oil Spill Detected"

        # ===============================
        # GENERATE PDF
        # ===============================
        generate_pdf_report(
            save_path,
            mask_save_path,
            overlay_save_path,
            result,
            confidence
        )

        # ===============================
        # PATHS FOR HTML
        # ===============================
        image_path = "uploads/" + file.filename
        mask_path = "uploads/" + mask_file
        overlay_path = "uploads/" + overlay_file
        report_path = "uploads/report.pdf"

    return render_template(
        "index.html",
        result=result,
        confidence=confidence,
        image_path=image_path,
        mask_path=mask_path,
        overlay_path=overlay_path,
        report_path=report_path
    )

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
