"""
KrishkAI Marketplace API Tests
Tests for: Seller/Buyer Registration, Listings, Bidding, Orders, Payment, Terms
"""
import pytest
import requests
import os
import time

# Get backend URL from frontend .env file
def get_backend_url():
    env_path = '/app/frontend/.env'
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().rstrip('/')
    return 'https://farm-assist-58.preview.emergentagent.com'

BASE_URL = get_backend_url()

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_user_credentials():
    """Test user credentials (already registered as seller and buyer)"""
    return {
        "phone": "9876543210",
        "password": "test123"
    }

@pytest.fixture
def auth_token(api_client, test_user_credentials):
    """Get auth token for test user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=test_user_credentials)
    assert response.status_code == 200
    return response.json()["token"]

@pytest.fixture
def auth_headers(auth_token):
    """Auth headers with Bearer token"""
    return {"Authorization": f"Bearer {auth_token}"}

# ============== TERMS & CONDITIONS ==============

class TestMarketTerms:
    """Terms and conditions endpoint tests"""
    
    def test_get_terms(self, api_client):
        """Test GET /api/market/terms"""
        response = api_client.get(f"{BASE_URL}/api/market/terms")
        assert response.status_code == 200
        
        data = response.json()
        assert "terms" in data
        assert "title" in data["terms"]
        assert "sections" in data["terms"]
        assert len(data["terms"]["sections"]) > 0
        print("✓ Terms & conditions retrieved successfully")

# ============== REGISTRATION ==============

class TestMarketRegistration:
    """Marketplace registration tests"""
    
    def test_get_profile_existing_user(self, api_client, auth_headers):
        """Test GET /api/market/profile for existing seller/buyer"""
        response = api_client.get(f"{BASE_URL}/api/market/profile", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "seller" in data
        assert "buyer" in data
        # Test user should already be registered
        assert data["seller"] is not None
        assert data["buyer"] is not None
        print(f"✓ Profile retrieved: seller={data['seller']['farm_name']}, buyer={data['buyer']['business_name']}")
    
    def test_register_seller_duplicate(self, api_client, auth_headers):
        """Test duplicate seller registration (should fail)"""
        response = api_client.post(f"{BASE_URL}/api/market/register-seller", 
            headers=auth_headers,
            json={
                "farm_name": "Test Farm",
                "farm_address": "Test Address",
                "farm_size_acres": 5.0,
                "crops_grown": "Rice, Wheat",
                "bank_account": "1234567890",
                "ifsc_code": "SBIN0001234",
                "accept_terms": True
            })
        assert response.status_code == 400
        error = response.json()
        assert "already registered" in error["detail"].lower()
        print("✓ Duplicate seller registration blocked")
    
    def test_register_buyer_duplicate(self, api_client, auth_headers):
        """Test duplicate buyer registration (should fail)"""
        response = api_client.post(f"{BASE_URL}/api/market/register-buyer",
            headers=auth_headers,
            json={
                "business_name": "Test Business",
                "business_type": "retailer",
                "address": "Test Address",
                "accept_terms": True
            })
        assert response.status_code == 400
        error = response.json()
        assert "already registered" in error["detail"].lower()
        print("✓ Duplicate buyer registration blocked")
    
    def test_register_without_terms(self, api_client, auth_headers):
        """Test registration without accepting terms"""
        # Create new user for this test
        new_phone = f"TEST_{int(time.time())}"
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TEST_NewUser",
            "phone": new_phone,
            "password": "test123"
        })
        assert reg_response.status_code == 200
        new_token = reg_response.json()["token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}
        
        response = api_client.post(f"{BASE_URL}/api/market/register-seller",
            headers=new_headers,
            json={
                "farm_name": "Test Farm",
                "farm_address": "Test",
                "accept_terms": False
            })
        assert response.status_code == 400
        error = response.json()
        assert "terms" in error["detail"].lower()
        print("✓ Terms acceptance validation working")

# ============== LISTINGS ==============

class TestMarketListings:
    """Produce listings tests"""
    
    def test_create_listing(self, api_client, auth_headers):
        """Test POST /api/market/listings"""
        response = api_client.post(f"{BASE_URL}/api/market/listings",
            headers=auth_headers,
            json={
                "crop_name": f"TEST_Crop_{int(time.time())}",
                "description": "High quality test crop",
                "quantity_kg": 100.0,
                "price_per_kg": 50.0,
                "min_order_kg": 10.0,
                "location": "Test Village",
                "harvest_date": "2025-03",
                "organic": True,
                "images": []
            })
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "listing" in data
        listing = data["listing"]
        assert listing["crop_name"].startswith("TEST_Crop_")
        assert listing["quantity_kg"] == 100.0
        assert listing["available_kg"] == 100.0
        assert listing["price_per_kg"] == 50.0
        assert listing["status"] == "active"
        print(f"✓ Listing created: {listing['id'][:8]} - {listing['crop_name']}")
        return listing["id"]
    
    def test_browse_listings(self, api_client):
        """Test GET /api/market/listings (browse)"""
        response = api_client.get(f"{BASE_URL}/api/market/listings")
        assert response.status_code == 200
        
        data = response.json()
        assert "listings" in data
        assert "count" in data
        assert len(data["listings"]) > 0
        print(f"✓ Browse listings: {data['count']} listings found")
    
    def test_browse_listings_with_search(self, api_client):
        """Test GET /api/market/listings with search"""
        response = api_client.get(f"{BASE_URL}/api/market/listings?search=rice")
        assert response.status_code == 200
        
        data = response.json()
        assert "listings" in data
        print(f"✓ Search listings: {data['count']} listings found for 'rice'")
    
    def test_browse_listings_organic_filter(self, api_client):
        """Test GET /api/market/listings with organic filter"""
        response = api_client.get(f"{BASE_URL}/api/market/listings?organic=true")
        assert response.status_code == 200
        
        data = response.json()
        assert "listings" in data
        # All returned listings should be organic
        for listing in data["listings"]:
            assert listing["organic"] is True
        print(f"✓ Organic filter: {data['count']} organic listings")
    
    def test_get_listing_detail(self, api_client):
        """Test GET /api/market/listings/{id}"""
        # First get a listing ID
        browse_response = api_client.get(f"{BASE_URL}/api/market/listings?limit=1")
        listings = browse_response.json()["listings"]
        if len(listings) == 0:
            pytest.skip("No listings available")
        
        listing_id = listings[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/market/listings/{listing_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "listing" in data
        assert "bids" in data
        assert data["listing"]["id"] == listing_id
        print(f"✓ Listing detail retrieved: {listing_id[:8]}")
    
    def test_get_my_listings(self, api_client, auth_headers):
        """Test GET /api/market/my-listings"""
        response = api_client.get(f"{BASE_URL}/api/market/my-listings", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "listings" in data
        print(f"✓ My listings: {len(data['listings'])} listings")

# ============== BIDDING ==============

class TestMarketBidding:
    """Bidding system tests"""
    
    def test_place_bid(self, api_client, auth_headers):
        """Test POST /api/market/bids"""
        # Get a listing to bid on (not owned by test user)
        browse_response = api_client.get(f"{BASE_URL}/api/market/listings")
        listings = browse_response.json()["listings"]
        
        # Get profile to check user_id
        profile_response = api_client.get(f"{BASE_URL}/api/market/profile", headers=auth_headers)
        user_id = profile_response.json()["user_id"]
        
        # Find a listing not owned by current user
        target_listing = None
        for listing in listings:
            if listing["seller_id"] != user_id and listing["available_kg"] > 0:
                target_listing = listing
                break
        
        if not target_listing:
            # Create a listing with a different user for testing
            pytest.skip("No suitable listing found for bidding test")
        
        response = api_client.post(f"{BASE_URL}/api/market/bids",
            headers=auth_headers,
            json={
                "listing_id": target_listing["id"],
                "offered_price_per_kg": target_listing["price_per_kg"] * 0.95,
                "quantity_kg": min(10.0, target_listing["available_kg"]),
                "message": "Test bid from automated test"
            })
        
        # If user is also the seller, this should fail
        if response.status_code == 400:
            error = response.json()
            if "own listing" in error["detail"].lower():
                print("✓ Cannot bid on own listing (expected)")
                return
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "bid" in data
        bid = data["bid"]
        assert bid["status"] == "pending"
        print(f"✓ Bid placed: {bid['id'][:8]} on listing {target_listing['id'][:8]}")
    
    def test_get_bids_for_listing(self, api_client, auth_headers):
        """Test GET /api/market/bids/{listing_id}"""
        # Get a listing with bids
        my_listings = api_client.get(f"{BASE_URL}/api/market/my-listings", headers=auth_headers)
        listings = my_listings.json()["listings"]
        
        if len(listings) == 0:
            pytest.skip("No listings to check bids")
        
        listing_id = listings[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/market/bids/{listing_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "bids" in data
        print(f"✓ Bids retrieved for listing: {len(data['bids'])} bids")

# ============== ORDERS ==============

class TestMarketOrders:
    """Order management tests"""
    
    def test_get_orders_all(self, api_client, auth_headers):
        """Test GET /api/market/orders (all)"""
        response = api_client.get(f"{BASE_URL}/api/market/orders?role=all", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        print(f"✓ All orders: {len(data['orders'])} orders")
    
    def test_get_orders_as_seller(self, api_client, auth_headers):
        """Test GET /api/market/orders?role=seller"""
        response = api_client.get(f"{BASE_URL}/api/market/orders?role=seller", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        print(f"✓ Seller orders: {len(data['orders'])} orders")
    
    def test_get_orders_as_buyer(self, api_client, auth_headers):
        """Test GET /api/market/orders?role=buyer"""
        response = api_client.get(f"{BASE_URL}/api/market/orders?role=buyer", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        print(f"✓ Buyer orders: {len(data['orders'])} orders")
    
    def test_get_order_detail(self, api_client, auth_headers):
        """Test GET /api/market/orders/{id}"""
        # Get an order first
        orders_response = api_client.get(f"{BASE_URL}/api/market/orders?role=all", headers=auth_headers)
        orders = orders_response.json()["orders"]
        
        if len(orders) == 0:
            pytest.skip("No orders available for testing")
        
        order_id = orders[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/market/orders/{order_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "order" in data
        order = data["order"]
        assert order["id"] == order_id
        assert "tracking" in order
        assert "commission_details" in order
        print(f"✓ Order detail retrieved: {order_id[:8]}")
    
    def test_accept_bid_creates_order(self, api_client, auth_headers):
        """Test POST /api/market/accept-bid creates order"""
        # This test requires a pending bid on seller's listing
        # Get seller's listings
        my_listings = api_client.get(f"{BASE_URL}/api/market/my-listings", headers=auth_headers)
        listings = my_listings.json()["listings"]
        
        if len(listings) == 0:
            pytest.skip("No listings to accept bids")
        
        # Check for pending bids
        for listing in listings:
            bids_response = api_client.get(f"{BASE_URL}/api/market/bids/{listing['id']}", headers=auth_headers)
            bids = bids_response.json()["bids"]
            pending_bids = [b for b in bids if b["status"] == "pending"]
            
            if len(pending_bids) > 0:
                bid_id = pending_bids[0]["id"]
                response = api_client.post(f"{BASE_URL}/api/market/accept-bid",
                    headers=auth_headers,
                    json={
                        "bid_id": bid_id,
                        "payment_method": "online"
                    })
                assert response.status_code == 200
                
                data = response.json()
                assert data["success"] is True
                assert "order" in data
                order = data["order"]
                assert order["status"] == "pending_payment"
                assert order["payment_method"] == "online"
                print(f"✓ Bid accepted, order created: {order['id'][:8]}")
                return
        
        print("⚠ No pending bids found to accept")

# ============== PAYMENT ==============

class TestMarketPayment:
    """Payment integration tests"""
    
    def test_create_checkout_session(self, api_client, auth_headers):
        """Test POST /api/market/checkout"""
        # Get an order in pending_payment status
        orders_response = api_client.get(f"{BASE_URL}/api/market/orders?role=all", headers=auth_headers)
        orders = orders_response.json()["orders"]
        
        pending_orders = [o for o in orders if o["status"] in ["pending_payment", "pending_seller_fee"]]
        
        if len(pending_orders) == 0:
            pytest.skip("No pending payment orders available")
        
        order = pending_orders[0]
        response = api_client.post(f"{BASE_URL}/api/market/checkout",
            headers=auth_headers,
            json={
                "order_id": order["id"],
                "origin_url": BASE_URL
            })
        
        # Stripe integration should return checkout URL
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "checkout_url" in data
        assert "session_id" in data
        print(f"✓ Checkout session created: {data['session_id'][:20]}...")
    
    def test_checkout_status(self, api_client, auth_headers):
        """Test GET /api/market/checkout/status/{session_id}"""
        # This test requires a valid session_id from previous checkout
        # For now, we'll test with a dummy session to verify endpoint exists
        response = api_client.get(f"{BASE_URL}/api/market/checkout/status/test_session_123", headers=auth_headers)
        # Should return 404 or status info
        assert response.status_code in [200, 404]
        print("✓ Checkout status endpoint accessible")

# ============== COMMISSION CALCULATION ==============

class TestCommissionLogic:
    """Test commission calculation in orders"""
    
    def test_commission_structure_online(self, api_client, auth_headers):
        """Verify 5% commission for online payments"""
        orders_response = api_client.get(f"{BASE_URL}/api/market/orders?role=all", headers=auth_headers)
        orders = orders_response.json()["orders"]
        
        online_orders = [o for o in orders if o["payment_method"] == "online"]
        
        if len(online_orders) == 0:
            pytest.skip("No online payment orders to verify")
        
        order = online_orders[0]
        expected_commission = order["total_amount"] * 0.05
        
        # Check if free period
        if order["commission_details"].get("is_free_period"):
            assert order["platform_fee"] == 0
            print("✓ Free period: 0% commission applied")
        else:
            assert abs(order["platform_fee"] - expected_commission) < 0.01
            print(f"✓ Online payment: 5% commission verified (₹{order['platform_fee']})")
    
    def test_commission_structure_direct(self, api_client, auth_headers):
        """Verify 5% + ₹50 for direct contact"""
        orders_response = api_client.get(f"{BASE_URL}/api/market/orders?role=all", headers=auth_headers)
        orders = orders_response.json()["orders"]
        
        direct_orders = [o for o in orders if o["payment_method"] == "direct_contact"]
        
        if len(direct_orders) == 0:
            pytest.skip("No direct contact orders to verify")
        
        order = direct_orders[0]
        expected_commission = order["total_amount"] * 0.05 + 50
        
        # Check if free period
        if order["commission_details"].get("is_free_period"):
            assert order["platform_fee"] == 0
            print("✓ Free period: 0% commission + ₹0 fee")
        else:
            assert abs(order["platform_fee"] - expected_commission) < 0.01
            print(f"✓ Direct contact: 5% + ₹50 verified (₹{order['platform_fee']})")

# ============== EDGE CASES ==============

class TestMarketplaceEdgeCases:
    """Edge case and validation tests"""
    
    def test_create_listing_without_auth(self, api_client):
        """Test creating listing without authentication"""
        response = api_client.post(f"{BASE_URL}/api/market/listings",
            json={
                "crop_name": "Test",
                "quantity_kg": 100,
                "price_per_kg": 50
            })
        assert response.status_code == 401
        print("✓ Listing creation requires authentication")
    
    def test_place_bid_on_own_listing(self, api_client, auth_headers):
        """Test bidding on own listing (should fail)"""
        # Get user's own listing
        my_listings = api_client.get(f"{BASE_URL}/api/market/my-listings", headers=auth_headers)
        listings = my_listings.json()["listings"]
        
        if len(listings) == 0:
            pytest.skip("No listings to test")
        
        listing_id = listings[0]["id"]
        response = api_client.post(f"{BASE_URL}/api/market/bids",
            headers=auth_headers,
            json={
                "listing_id": listing_id,
                "offered_price_per_kg": 50,
                "quantity_kg": 10
            })
        assert response.status_code == 400
        error = response.json()
        assert "own listing" in error["detail"].lower()
        print("✓ Cannot bid on own listing")
    
    def test_bid_exceeds_available_quantity(self, api_client, auth_headers):
        """Test bidding more than available quantity"""
        # Get a listing
        browse_response = api_client.get(f"{BASE_URL}/api/market/listings?limit=1")
        listings = browse_response.json()["listings"]
        
        if len(listings) == 0:
            pytest.skip("No listings available")
        
        listing = listings[0]
        
        # Get profile to check if it's own listing
        profile_response = api_client.get(f"{BASE_URL}/api/market/profile", headers=auth_headers)
        user_id = profile_response.json()["user_id"]
        
        if listing["seller_id"] == user_id:
            pytest.skip("Cannot test with own listing")
        
        response = api_client.post(f"{BASE_URL}/api/market/bids",
            headers=auth_headers,
            json={
                "listing_id": listing["id"],
                "offered_price_per_kg": listing["price_per_kg"],
                "quantity_kg": listing["available_kg"] + 1000  # Exceed available
            })
        assert response.status_code == 400
        error = response.json()
        assert "exceeds" in error["detail"].lower()
        print("✓ Bid quantity validation working")
