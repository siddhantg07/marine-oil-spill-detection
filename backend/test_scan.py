import requests
import os

BASE_URL = "http://127.0.0.1:5000"
IMAGE_PATH = "static/uploads/img_0022.jpg"

if not os.path.exists(IMAGE_PATH):
    print(f"Error: Test image not found at {IMAGE_PATH}")
    # Try to find any jpg
    for f in os.listdir("static/uploads"):
        if f.endswith(".jpg") and "mask" not in f and "overlay" not in f:
            IMAGE_PATH = os.path.join("static/uploads", f)
            print(f"Using alternative image: {IMAGE_PATH}")
            break

session = requests.Session()

# 1. Register/Login
username = "debug_user_001"
password = "password123"

print(f"Registering/Logging in as {username}...")
# Try register
session.post(f"{BASE_URL}/register", data={"username": username, "password": password, "email": "test@test.com"})

# Try login
login_resp = session.post(f"{BASE_URL}/login", json={"username": username, "password": password})
print(f"Login Status: {login_resp.status_code}")

if login_resp.status_code != 200:
    print(f"Login failed: {login_resp.text}")
    # Fallback for form login if json not supported (but app.py supports json)
    login_resp = session.post(f"{BASE_URL}/login", data={"username": username, "password": password})
    print(f"Form Login Status: {login_resp.status_code}")

# 2. Upload Scan
print("Uploading scan...")
with open(IMAGE_PATH, "rb") as f:
    files = {"image": (os.path.basename(IMAGE_PATH), f, "image/jpeg")}
    try:
        resp = session.post(f"{BASE_URL}/scan", files=files)
        print(f"Scan Status: {resp.status_code}")
        print("Response Body:")
        print(resp.text)
    except Exception as e:
        print(f"Request failed: {e}")
