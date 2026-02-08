import urllib.request
import json

url = "http://localhost:5000/login"
data = {"username": "admin", "password": "password123"}
json_data = json.dumps(data).encode('utf-8')

req = urllib.request.Request(url, data=json_data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
        print("LOGIN SUCCESSFUL")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(e.read().decode('utf-8'))
    print("LOGIN FAILED")
except Exception as e:
    print(f"Error: {e}")
