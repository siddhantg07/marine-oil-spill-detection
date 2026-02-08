import urllib.request
import urllib.parse
import http.cookiejar
import json

# Setup cookie jar
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
urllib.request.install_opener(opener)

BASE_URL = "http://localhost:5000"

def login(username, password):
    url = f"{BASE_URL}/login"
    data = {"username": username, "password": password}
    json_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})
    
    try:
        with opener.open(req) as response:
            print(f"Login {username}: {response.status}")
            return True
    except Exception as e:
        print(f"Login failed: {e}")
        return False

def change_password(current_pw, new_pw):
    url = f"{BASE_URL}/profile"
    data = {"current_password": current_pw, "new_password": new_pw}
    json_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})
    
    try:
        with opener.open(req) as response:
            print(f"Change Password: {response.status}")
            print(response.read().decode('utf-8'))
            return True
    except urllib.error.HTTPError as e:
        print(f"Change Password Failed: {e.code}")
        print(e.read().decode('utf-8'))
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

# 1. Login with testuser
if login("testuser", "password123"):
    # 2. Change password
    if change_password("password123", "newpass789"):
        # 3. Verify new login
        print("Verifying new login...")
        # Clear cookies to force re-login check
        cj.clear()
        if login("testuser", "newpass789"):
            print("SUCCESS: Password changed and verified!")
        else:
            print("FAILURE: Could not login with new password.")
    else:
        print("FAILURE: Password change request failed.")
else:
    print("Skipping... could not login initially.")
