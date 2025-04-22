# admin_side/test_api.py
import requests
import json

# Base URL of your Flask API
base_url = "http://localhost:5000"

def test_register_student():
    """Test student registration"""
    url = f"{base_url}/api/auth/register/student"
    data = {
        "email": "student@test.com",
        "password": "password123",
        "firstName": "John",
        "lastName": "Doe",
        "studentId": "ITBIN-2110-1000",
        "faculty": "Information Technology",
        "intakeNo": "6",
        "academicYear": "2024"
    }
    
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_login():
    """Test login with the registered student"""
    url = f"{base_url}/api/auth/login"
    data = {
        "email": "student@test.com",
        "password": "password123"
    }
    
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        return response.json().get('token')
    return None

def test_get_guidance(token):
    """Test getting guidance with token"""
    url = f"{base_url}/api/students/1/guidance"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Testing student registration...")
    test_register_student()
    
    print("\nTesting login...")
    token = test_login()
    
    if token:
        print("\nTesting guidance with token...")
        test_get_guidance(token)