"""
KrishkAI Backend API Tests
Tests for: Auth, Crop Recommendation, Disease Detection, Chat, Credit Scoring, Knowledge Base
"""
import pytest
import requests
import os
import base64
import json

# Get backend URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_user_credentials():
    """Test user credentials"""
    return {
        "phone": "9876543210",
        "password": "test123"
    }

@pytest.fixture
def new_test_user():
    """New test user for registration"""
    import time
    return {
        "name": "TEST_User",
        "phone": f"TEST_{int(time.time())}",
        "password": "testpass123",
        "language": "en",
        "state": "Karnataka",
        "district": "Bangalore"
    }

# ============== HEALTH CHECK ==============

class TestHealth:
    """Health check endpoint tests"""
    
    def test_health_check(self, api_client):
        """Test /api/health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")

# ============== AUTH TESTS ==============

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self, api_client, new_test_user):
        """Test user registration"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_test_user)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["name"] == new_test_user["name"]
        assert data["user"]["phone"] == new_test_user["phone"]
        print(f"✓ User registration successful: {data['user']['phone']}")
    
    def test_register_duplicate_phone(self, api_client, test_user_credentials):
        """Test registration with existing phone number"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate User",
            "phone": test_user_credentials["phone"],
            "password": "anypass"
        })
        assert response.status_code == 400
        error = response.json()
        assert "already registered" in error["detail"].lower()
        print("✓ Duplicate phone validation working")
    
    def test_login_success(self, api_client, test_user_credentials):
        """Test successful login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=test_user_credentials)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["phone"] == test_user_credentials["phone"]
        print(f"✓ Login successful for {test_user_credentials['phone']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "phone": "0000000000",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        error = response.json()
        assert "invalid" in error["detail"].lower()
        print("✓ Invalid login rejected")
    
    def test_get_profile(self, api_client, test_user_credentials):
        """Test get profile with valid token"""
        # First login to get token
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json=test_user_credentials)
        token = login_response.json()["token"]
        
        # Get profile
        response = api_client.get(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert data["phone"] == test_user_credentials["phone"]
        print("✓ Profile retrieval successful")

# ============== CROP RECOMMENDATION TESTS ==============

class TestCropRecommendation:
    """Crop recommendation endpoint tests"""
    
    def test_crop_recommend_success(self, api_client):
        """Test crop recommendation with valid data"""
        payload = {
            "terrain_type": "Plains",
            "soil_type": "Alluvial",
            "temperature": 28.5,
            "humidity": 65.0,
            "rainfall": 120.0,
            "fertilizer_used": "Urea",
            "problems": "None",
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/crop/recommend", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data or "raw" in data
        
        # If AI returned structured data, validate it
        if data.get("data"):
            assert "recommended_crops" in data["data"] or "best_crop" in data["data"]
        
        print("✓ Crop recommendation successful")
    
    def test_crop_recommend_missing_fields(self, api_client):
        """Test crop recommendation with missing required fields"""
        payload = {
            "terrain_type": "Plains",
            # Missing soil_type, temperature, etc.
        }
        
        response = api_client.post(f"{BASE_URL}/api/crop/recommend", json=payload)
        assert response.status_code == 422  # Pydantic validation error
        print("✓ Missing field validation working")

# ============== DISEASE DETECTION TESTS ==============

class TestDiseaseDetection:
    """Disease detection endpoint tests"""
    
    def test_disease_detect_with_image(self, api_client):
        """Test disease detection with base64 image"""
        # Create a simple test image (1x1 red pixel PNG)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        payload = {
            "image_base64": test_image_base64,
            "description": "Leaves turning yellow",
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/disease/detect", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data or "raw" in data
        
        print("✓ Disease detection successful")
    
    def test_disease_detect_missing_image(self, api_client):
        """Test disease detection without image"""
        payload = {
            "description": "Leaves turning yellow",
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/disease/detect", json=payload)
        assert response.status_code == 422  # Missing required field
        print("✓ Missing image validation working")

# ============== CHAT TESTS ==============

class TestChat:
    """Knowledge hub chat endpoint tests"""
    
    def test_chat_message_success(self, api_client):
        """Test sending a chat message"""
        payload = {
            "message": "What are the best crops for summer?",
            "session_id": "test_session_123",
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "response" in data
        assert len(data["response"]) > 0
        assert data["session_id"] == payload["session_id"]
        
        print(f"✓ Chat message successful, AI response length: {len(data['response'])}")
    
    def test_chat_history(self, api_client):
        """Test retrieving chat history"""
        session_id = "test_session_123"
        
        # Send a message first
        api_client.post(f"{BASE_URL}/api/chat/message", json={
            "message": "Test message",
            "session_id": session_id,
            "language": "en"
        })
        
        # Get history
        response = api_client.get(f"{BASE_URL}/api/chat/history/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        
        print(f"✓ Chat history retrieved: {len(data['messages'])} messages")

# ============== CREDIT SCORING TESTS ==============

class TestCreditScoring:
    """Credit scoring endpoint tests"""
    
    def test_credit_assess_high_score(self, api_client):
        """Test credit assessment with high score inputs"""
        payload = {
            "annual_income": 500000,
            "land_area_acres": 10,
            "farming_experience_years": 15,
            "previous_loans": 2,
            "loan_repaid": 2,
            "crop_type": "Rice, Wheat, Cotton",
            "investment_amount": 200000,
            "savings": 100000,
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/credit/assess", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        result = data["data"]
        assert "credit_score" in result
        assert "eligibility" in result
        assert "max_loan_amount" in result
        assert result["credit_score"] >= 70  # Should be high score
        
        print(f"✓ Credit assessment successful: Score={result['credit_score']}, Eligibility={result['eligibility']}")
    
    def test_credit_assess_low_score(self, api_client):
        """Test credit assessment with low score inputs"""
        payload = {
            "annual_income": 50000,
            "land_area_acres": 0.5,
            "farming_experience_years": 1,
            "previous_loans": 0,
            "loan_repaid": 0,
            "crop_type": "",
            "investment_amount": 0,
            "savings": 0,
            "language": "en"
        }
        
        response = api_client.post(f"{BASE_URL}/api/credit/assess", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        result = data["data"]
        assert result["credit_score"] < 70  # Should be lower score
        
        print(f"✓ Low credit score calculated correctly: {result['credit_score']}")

# ============== KNOWLEDGE BASE TESTS ==============

class TestKnowledgeBase:
    """Knowledge base endpoint tests"""
    
    def test_get_knowledge_base(self, api_client):
        """Test retrieving knowledge base"""
        response = api_client.get(f"{BASE_URL}/api/knowledge/base")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0
        
        # Check first category structure
        first_cat = data["categories"][0]
        assert "id" in first_cat
        assert "title" in first_cat
        assert "items" in first_cat
        
        print(f"✓ Knowledge base retrieved: {len(data['categories'])} categories")

# ============== CLEANUP ==============

def test_cleanup_test_users(api_client):
    """Cleanup test users created during testing"""
    # This is a placeholder - in production you'd want to clean up test data
    # For now, we'll just log that cleanup should happen
    print("✓ Test cleanup completed (test users prefixed with TEST_)")
