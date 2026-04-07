from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Commission config
ONLINE_COMMISSION_RATE = 0.05  # 5%
DIRECT_COMMISSION_RATE = 0.05  # 5%
DIRECT_FIXED_FEE = 50.0  # ₹50
FREE_PERIOD_DAYS = 60  # 2 months free

# JWT - same as server.py
import jwt as pyjwt
JWT_SECRET = "krishkai_secret_key_2025"
JWT_ALGORITHM = "HS256"

market_router = APIRouter(prefix="/api/market")

# ============== MODELS ==============

class SellerRegister(BaseModel):
    farm_name: str
    farm_address: str
    farm_size_acres: float = 0
    crops_grown: str = ""
    bank_account: str = ""
    ifsc_code: str = ""
    accept_terms: bool = False

class BuyerRegister(BaseModel):
    business_name: str
    business_type: str = ""  # retailer, wholesaler, processor, consumer
    address: str = ""
    accept_terms: bool = False

class CreateListing(BaseModel):
    crop_name: str
    description: str = ""
    quantity_kg: float
    price_per_kg: float
    min_order_kg: float = 1
    location: str = ""
    harvest_date: str = ""
    organic: bool = False
    images: List[str] = []  # base64 images

class PlaceBid(BaseModel):
    listing_id: str
    offered_price_per_kg: float
    quantity_kg: float
    message: str = ""

class AcceptBid(BaseModel):
    bid_id: str
    payment_method: str = "online"  # online or direct_contact

class UpdateOrderStatus(BaseModel):
    status: str  # confirmed, shipped, in_transit, delivered, cancelled

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

# ============== AUTH HELPER ==============

async def get_market_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def is_free_period(registered_at: str) -> bool:
    try:
        reg_date = datetime.fromisoformat(registered_at)
        return datetime.now(timezone.utc) - reg_date < timedelta(days=FREE_PERIOD_DAYS)
    except Exception:
        return False

def calc_commission(amount: float, method: str, is_free: bool) -> dict:
    if is_free:
        return {"commission": 0.0, "fixed_fee": 0.0, "total_fee": 0.0, "seller_receives": amount, "is_free_period": True}
    if method == "direct_contact":
        commission = amount * DIRECT_COMMISSION_RATE
        return {"commission": round(commission, 2), "fixed_fee": DIRECT_FIXED_FEE, "total_fee": round(commission + DIRECT_FIXED_FEE, 2), "seller_receives": round(amount - commission - DIRECT_FIXED_FEE, 2), "is_free_period": False}
    commission = amount * ONLINE_COMMISSION_RATE
    return {"commission": round(commission, 2), "fixed_fee": 0.0, "total_fee": round(commission, 2), "seller_receives": round(amount - commission, 2), "is_free_period": False}

# ============== REGISTRATION ==============

@market_router.post("/register-seller")
async def register_seller(data: SellerRegister, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    if not data.accept_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms and conditions")
    
    existing = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as seller")
    
    profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_phone": user["phone"],
        "farm_name": data.farm_name,
        "farm_address": data.farm_address,
        "farm_size_acres": data.farm_size_acres,
        "crops_grown": data.crops_grown,
        "bank_account": data.bank_account,
        "ifsc_code": data.ifsc_code,
        "is_verified": False,
        "rating": 0,
        "total_sales": 0,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "terms_accepted_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.seller_profiles.insert_one(profile)
    profile.pop("_id", None)
    return {"success": True, "profile": profile}

@market_router.post("/register-buyer")
async def register_buyer(data: BuyerRegister, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    if not data.accept_terms:
        raise HTTPException(status_code=400, detail="You must accept the terms and conditions")
    
    existing = await db.buyer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as buyer")
    
    profile = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_phone": user["phone"],
        "business_name": data.business_name,
        "business_type": data.business_type,
        "address": data.address,
        "is_verified": False,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "terms_accepted_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.buyer_profiles.insert_one(profile)
    profile.pop("_id", None)
    return {"success": True, "profile": profile}

@market_router.get("/profile")
async def get_market_profile(authorization: str = Header(None)):
    user = await get_market_user(authorization)
    seller = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    buyer = await db.buyer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"seller": seller, "buyer": buyer, "user_id": user["id"], "user_name": user["name"]}

# ============== LISTINGS ==============

@market_router.post("/listings")
async def create_listing(data: CreateListing, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    seller = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=403, detail="Register as seller first")
    
    listing = {
        "id": str(uuid.uuid4()),
        "seller_id": user["id"],
        "seller_name": user["name"],
        "seller_phone": user["phone"],
        "farm_name": seller.get("farm_name", ""),
        "crop_name": data.crop_name,
        "description": data.description,
        "quantity_kg": data.quantity_kg,
        "available_kg": data.quantity_kg,
        "price_per_kg": data.price_per_kg,
        "min_order_kg": data.min_order_kg,
        "location": data.location or seller.get("farm_address", ""),
        "harvest_date": data.harvest_date,
        "organic": data.organic,
        "images": data.images[:3],  # Max 3 images
        "status": "active",
        "bid_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.produce_listings.insert_one(listing)
    listing.pop("_id", None)
    return {"success": True, "listing": listing}

@market_router.get("/listings")
async def browse_listings(search: str = "", crop: str = "", organic: str = "", sort: str = "newest", limit: int = 50):
    query: dict = {"status": "active", "available_kg": {"$gt": 0}}
    if search:
        query["$or"] = [
            {"crop_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]
    if crop:
        query["crop_name"] = {"$regex": crop, "$options": "i"}
    if organic == "true":
        query["organic"] = True
    
    sort_key = [("created_at", -1)] if sort == "newest" else [("price_per_kg", 1)]
    listings = await db.produce_listings.find(query, {"_id": 0}).sort(sort_key).to_list(limit)
    return {"listings": listings, "count": len(listings)}

@market_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.produce_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    bids = await db.bids.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"listing": listing, "bids": bids}

@market_router.get("/my-listings")
async def my_listings(authorization: str = Header(None)):
    user = await get_market_user(authorization)
    listings = await db.produce_listings.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"listings": listings}

# ============== BIDDING ==============

@market_router.post("/bids")
async def place_bid(data: PlaceBid, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    buyer = await db.buyer_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not buyer:
        raise HTTPException(status_code=403, detail="Register as buyer first")
    
    listing = await db.produce_listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["seller_id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot bid on your own listing")
    if data.quantity_kg > listing["available_kg"]:
        raise HTTPException(status_code=400, detail="Quantity exceeds available stock")
    
    bid = {
        "id": str(uuid.uuid4()),
        "listing_id": data.listing_id,
        "buyer_id": user["id"],
        "buyer_name": user["name"],
        "buyer_phone": user["phone"],
        "business_name": buyer.get("business_name", ""),
        "offered_price_per_kg": data.offered_price_per_kg,
        "quantity_kg": data.quantity_kg,
        "total_amount": round(data.offered_price_per_kg * data.quantity_kg, 2),
        "message": data.message,
        "status": "pending",  # pending, accepted, rejected, withdrawn
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bids.insert_one(bid)
    await db.produce_listings.update_one({"id": data.listing_id}, {"$inc": {"bid_count": 1}})
    bid.pop("_id", None)
    return {"success": True, "bid": bid}

@market_router.get("/bids/{listing_id}")
async def get_bids(listing_id: str, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    bids = await db.bids.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"bids": bids}

# ============== ACCEPT BID / CREATE ORDER ==============

@market_router.post("/accept-bid")
async def accept_bid(data: AcceptBid, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    bid = await db.bids.find_one({"id": data.bid_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    listing = await db.produce_listings.find_one({"id": bid["listing_id"]}, {"_id": 0})
    if not listing or listing["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    if bid["status"] != "pending":
        raise HTTPException(status_code=400, detail="Bid already processed")
    
    seller = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    is_free = is_free_period(seller.get("registered_at", "")) if seller else False
    
    total = bid["total_amount"]
    commission = calc_commission(total, data.payment_method, is_free)
    
    order = {
        "id": str(uuid.uuid4()),
        "listing_id": bid["listing_id"],
        "bid_id": bid["id"],
        "seller_id": user["id"],
        "seller_name": user["name"],
        "seller_phone": user["phone"],
        "buyer_id": bid["buyer_id"],
        "buyer_name": bid["buyer_name"],
        "buyer_phone": bid["buyer_phone"],
        "crop_name": listing["crop_name"],
        "quantity_kg": bid["quantity_kg"],
        "price_per_kg": bid["offered_price_per_kg"],
        "total_amount": total,
        "payment_method": data.payment_method,
        "commission_details": commission,
        "platform_fee": commission["total_fee"],
        "seller_receives": commission["seller_receives"],
        "status": "pending_payment" if data.payment_method == "online" else "pending_seller_fee",
        "payment_status": "pending",
        "tracking": [{"status": "Order Created", "timestamp": datetime.now(timezone.utc).isoformat(), "note": f"Bid accepted. Payment method: {data.payment_method}"}],
        "terms_agreement": f"Seller agrees to {ONLINE_COMMISSION_RATE*100}% platform commission" + (f" + ₹{DIRECT_FIXED_FEE} handling fee" if data.payment_method == "direct_contact" else "") + (". FREE PERIOD - No fees applied." if is_free else "."),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order)
    
    # Update bid status
    await db.bids.update_one({"id": data.bid_id}, {"$set": {"status": "accepted"}})
    # Update listing available quantity
    new_available = listing["available_kg"] - bid["quantity_kg"]
    update_fields: dict = {"available_kg": max(new_available, 0)}
    if new_available <= 0:
        update_fields["status"] = "sold_out"
    await db.produce_listings.update_one({"id": bid["listing_id"]}, {"$set": update_fields})
    
    order.pop("_id", None)
    return {"success": True, "order": order}

# ============== ORDERS ==============

@market_router.get("/orders")
async def get_orders(role: str = "all", authorization: str = Header(None)):
    user = await get_market_user(authorization)
    if role == "seller":
        query = {"seller_id": user["id"]}
    elif role == "buyer":
        query = {"buyer_id": user["id"]}
    else:
        query = {"$or": [{"seller_id": user["id"]}, {"buyer_id": user["id"]}]}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@market_router.get("/orders/{order_id}")
async def get_order(order_id: str, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["seller_id"] != user["id"] and order["buyer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your order")
    return {"order": order}

@market_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: UpdateOrderStatus, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only seller can update status")
    
    valid_transitions = {
        "pending_payment": ["confirmed", "cancelled"],
        "pending_seller_fee": ["confirmed", "cancelled"],
        "confirmed": ["shipped", "cancelled"],
        "shipped": ["in_transit", "delivered"],
        "in_transit": ["delivered"],
    }
    current = order["status"]
    if current not in valid_transitions or data.status not in valid_transitions.get(current, []):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {current} to {data.status}")
    
    tracking_entry = {"status": data.status.replace("_", " ").title(), "timestamp": datetime.now(timezone.utc).isoformat(), "note": f"Updated by seller"}
    await db.orders.update_one({"id": order_id}, {
        "$set": {"status": data.status},
        "$push": {"tracking": tracking_entry}
    })
    return {"success": True, "status": data.status}

# ============== STRIPE PAYMENT ==============

@market_router.post("/checkout")
async def create_checkout(data: CheckoutRequest, http_request: Request, authorization: str = Header(None)):
    user = await get_market_user(authorization)
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["buyer_id"] != user["id"] and order["seller_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your order")

    # Determine what to charge
    if order["payment_method"] == "online" and order["buyer_id"] == user["id"]:
        amount = order["total_amount"]
        description = f"Payment for {order['crop_name']} - {order['quantity_kg']}kg"
        payment_type = "buyer_payment"
    elif order["payment_method"] == "direct_contact" and order["seller_id"] == user["id"]:
        amount = order["platform_fee"]
        description = f"Platform fee for order {order['id'][:8]}"
        payment_type = "seller_fee"
    else:
        raise HTTPException(status_code=400, detail="Invalid payment request")

    try:
        origin = data.origin_url.rstrip("/")
        success_url = f"{origin}/marketplace/payment?session_id={{CHECKOUT_SESSION_ID}}&order_id={order['id']}"
        cancel_url = f"{origin}/marketplace/orders"

        # Convert amount to paise (Stripe uses smallest currency unit)
        amount_paise = int(float(amount) * 100)

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": description,
                    },
                    "unit_amount": amount_paise,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "order_id": order["id"],
                "user_id": user["id"],
                "payment_type": payment_type,
            }
        )

        # Save transaction record
        tx = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "order_id": order["id"],
            "user_id": user["id"],
            "amount": float(amount),
            "currency": "inr",
            "description": description,
            "payment_status": "initiated",
            "metadata": {
                "order_id": order["id"],
                "user_id": user["id"],
                "payment_type": payment_type,
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.payment_transactions.insert_one(tx)

        return {"success": True, "checkout_url": session.url, "session_id": session.id}

    except Exception as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@market_router.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, authorization: str = Header(None)):
    await get_market_user(authorization)

    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Return cached status if already paid
    if tx.get("payment_status") in ["paid", "completed"]:
        return {"status": "paid", "order_id": tx.get("order_id")}

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        payment_status = session.payment_status  # "paid", "unpaid", "no_payment_required"

        # Update transaction in DB
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": payment_status,
                "status": session.status
            }}
        )

        # If paid, update the order
        if payment_status == "paid":
            order = await db.orders.find_one({"id": tx["order_id"]}, {"_id": 0})
            if order and order["payment_status"] != "paid":
                tracking_entry = {
                    "status": "Payment Received",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "note": "Payment confirmed via Stripe"
                }
                await db.orders.update_one(
                    {"id": tx["order_id"]},
                    {
                        "$set": {"payment_status": "paid", "status": "confirmed"},
                        "$push": {"tracking": tracking_entry}
                    }
                )

        return {"status": payment_status, "order_id": tx.get("order_id")}

    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        return {"status": tx.get("payment_status", "pending"), "order_id": tx.get("order_id")}

# ============== TERMS & CONDITIONS ==============

@market_router.get("/terms")
async def get_terms():
    return {
        "terms": {
            "title": "KrishkAI Marketplace Terms & Conditions",
            "version": "1.0",
            "effective_date": "2025-01-01",
            "sections": [
                {
                    "heading": "Platform Commission",
                    "content": f"KrishkAI charges a {ONLINE_COMMISSION_RATE*100}% commission on all marketplace transactions. For direct contact sales, an additional fixed fee of ₹{DIRECT_FIXED_FEE} applies. New sellers enjoy a {FREE_PERIOD_DAYS}-day free trial period with no commission charges."
                },
                {
                    "heading": "Payment Terms",
                    "content": "All online payments are processed securely via Stripe. For direct contact transactions, the seller is required to pay the platform commission within 7 days of the transaction."
                },
                {
                    "heading": "Legally Binding Agreement",
                    "content": "By registering as a buyer or seller on KrishkAI Marketplace, you agree to these terms. All transactions conducted through this platform are legally binding contracts between the buyer and seller, with KrishkAI acting as the facilitating platform."
                },
                {
                    "heading": "Dispute Resolution",
                    "content": "In case of disputes, KrishkAI will mediate between buyer and seller. If unresolved, disputes shall be subject to arbitration under Indian Arbitration and Conciliation Act, 1996."
                },
                {
                    "heading": "Quality Standards",
                    "content": "Sellers must accurately describe their produce. Any misrepresentation may result in account suspension and refund obligations."
                },
                {
                    "heading": "Cancellation Policy",
                    "content": "Orders may be cancelled before shipping. After shipping, cancellations are subject to a 10% handling fee. Perishable goods have modified policies based on delivery timeline."
                }
            ]
        }
    }
