from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import base64
import tempfile
import json
from huggingface_hub import InferenceClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = "krishkai_secret_key_2025"
JWT_ALGORITHM = "HS256"

# LLM Key
LLM_KEY = os.getenv('LLM_KEY')
hf_client = InferenceClient(
    api_key=os.getenv("LLM_KEY")
)

app = FastAPI(title="KrishkAI API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserRegister(BaseModel):
    name: str
    phone: str
    password: str
    language: str = "en"
    state: str = ""
    district: str = ""

class UserLogin(BaseModel):
    phone: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    phone: str
    language: str
    state: str
    district: str
    created_at: str

class CropRecommendRequest(BaseModel):
    terrain_type: str
    soil_type: str
    temperature: float
    humidity: float
    rainfall: float
    fertilizer_used: str = ""
    problems: str = ""
    language: str = "en"

class DiseaseDetectRequest(BaseModel):
    image_base64: str
    description: str = ""
    language: str = "en"

class ChatMessageRequest(BaseModel):
    message: str
    session_id: str = ""
    language: str = "en"

class CreditScoreRequest(BaseModel):
    annual_income: float
    land_area_acres: float
    farming_experience_years: int
    previous_loans: int = 0
    loan_repaid: int = 0
    crop_type: str = ""
    investment_amount: float = 0
    savings: float = 0
    language: str = "en"

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    user_id = decode_token(token)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "phone": data.phone,
        "password": hash_password(data.password),
        "language": data.language,
        "state": data.state,
        "district": data.district,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "name": data.name, "phone": data.phone, "language": data.language, "state": data.state, "district": data.district}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "phone": user["phone"], "language": user.get("language", "en"), "state": user.get("state", ""), "district": user.get("district", "")}}

@api_router.get("/auth/profile")
async def get_profile(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    return {"id": user["id"], "name": user["name"], "phone": user["phone"], "language": user.get("language", "en"), "state": user.get("state", ""), "district": user.get("district", ""), "created_at": user.get("created_at", "")}

@api_router.put("/auth/profile")
async def update_profile(authorization: str = Header(None), name: str = "", language: str = "", state: str = "", district: str = ""):
    user = await get_current_user(authorization)
    update_data = {}
    if name: update_data["name"] = name
    if language: update_data["language"] = language
    if state: update_data["state"] = state
    if district: update_data["district"] = district
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated

# ============== AI HELPER ==============

async def get_ai_response(system_message: str, user_text: str, image_base64: str = None, session_id: str = None):
    try:
        # Build message content
        if image_base64:
            # Convert base64 to data URL for the model
            image_url = f"data:image/jpeg;base64,{image_base64}"
            content = [
                {
                    "type": "text",
                    "text": user_text
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": image_url
                    }
                }
            ]
        else:
            content = [
                {
                    "type": "text",
                    "text": user_text
                }
            ]

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": content}
        ]

        completion = hf_client.chat.completions.create(
            model="google/gemma-4-26B-A4B-it:novita",
            messages=messages
        )

        return completion.choices[0].message.content

    except Exception as e:
        logger.error(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ============== CROP RECOMMENDATION ==============

@api_router.post("/crop/recommend")
async def crop_recommend(data: CropRecommendRequest):
    lang_instruction = f"Respond in {'Hindi' if data.language == 'hi' else 'Tamil' if data.language == 'ta' else 'Telugu' if data.language == 'te' else 'Kannada' if data.language == 'kn' else 'Marathi' if data.language == 'mr' else 'Bengali' if data.language == 'bn' else 'English'}."
    
    system_msg = f"""You are KrishkAI, an expert agricultural advisor for Indian farmers. Provide detailed crop recommendations based on the given conditions. {lang_instruction}

Always respond in this JSON format:
{{
  "recommended_crops": ["crop1", "crop2", "crop3"],
  "best_crop": "crop_name",
  "reasoning": "Why this crop is best for given conditions",
  "soil_tips": "Tips for improving soil health",
  "water_management": "Irrigation and water management advice",
  "fertilizer_advice": "Recommended fertilizers and application schedule",
  "expected_yield": "Expected yield per acre",
  "season_info": "Best planting and harvesting season",
  "warnings": "Any warnings or precautions"
}}"""

    user_text = f"""Farm conditions:
- Terrain: {data.terrain_type}
- Soil Type: {data.soil_type}
- Temperature: {data.temperature}°C
- Humidity: {data.humidity}%
- Rainfall: {data.rainfall}mm
- Fertilizer Used: {data.fertilizer_used or 'None specified'}
- Problems: {data.problems or 'None'}

Provide crop recommendations."""

    response = await get_ai_response(system_msg, user_text)
    
    # Store recommendation
    rec_doc = {
        "id": str(uuid.uuid4()),
        "input": data.dict(),
        "response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.crop_recommendations.insert_one(rec_doc)
    
    # Try to parse JSON from response
    try:
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        elif "{" in response:
            start = response.index("{")
            end = response.rindex("}") + 1
            json_str = response[start:end]
        else:
            json_str = response
        parsed = json.loads(json_str)
        return {"success": True, "data": parsed, "raw": response}
    except Exception:
        return {"success": True, "data": None, "raw": response}

# ============== DISEASE DETECTION ==============

@api_router.post("/disease/detect")
async def disease_detect(data: DiseaseDetectRequest):
    lang_instruction = f"Respond in {'Hindi' if data.language == 'hi' else 'Tamil' if data.language == 'ta' else 'Telugu' if data.language == 'te' else 'Kannada' if data.language == 'kn' else 'Marathi' if data.language == 'mr' else 'Bengali' if data.language == 'bn' else 'English'}."
    
    system_msg = f"""You are KrishkAI, an expert plant pathologist and agricultural disease specialist for Indian crops. Analyze crop images to detect diseases, pests, and health issues. {lang_instruction}

Always respond in this JSON format:
{{
  "is_healthy": true/false,
  "disease_name": "Name of detected disease or 'Healthy'",
  "confidence": "High/Medium/Low",
  "symptoms": "Visible symptoms observed",
  "cause": "What causes this disease",
  "treatment": "Recommended treatment and pesticides",
  "prevention": "How to prevent this in future",
  "organic_remedy": "Natural/organic treatment options",
  "severity": "Mild/Moderate/Severe",
  "urgency": "Immediate action needed / Can wait / Monitoring advised"
}}"""

    desc_text = f"\nFarmer's description: {data.description}" if data.description else ""
    user_text = f"Analyze this crop image for diseases and health issues.{desc_text}"

    response = await get_ai_response(system_msg, user_text, image_base64=data.image_base64)
    
    # Store detection
    det_doc = {
        "id": str(uuid.uuid4()),
        "description": data.description,
        "response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.disease_detections.insert_one(det_doc)
    
    try:
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        elif "{" in response:
            start = response.index("{")
            end = response.rindex("}") + 1
            json_str = response[start:end]
        else:
            json_str = response
        parsed = json.loads(json_str)
        return {"success": True, "data": parsed, "raw": response}
    except Exception:
        return {"success": True, "data": None, "raw": response}

# ============== KNOWLEDGE HUB CHAT ==============

@api_router.post("/chat/message")
async def chat_message(data: ChatMessageRequest):
    session_id = data.session_id or str(uuid.uuid4())
    lang_instruction = f"Respond in {'Hindi' if data.language == 'hi' else 'Tamil' if data.language == 'ta' else 'Telugu' if data.language == 'te' else 'Kannada' if data.language == 'kn' else 'Marathi' if data.language == 'mr' else 'Bengali' if data.language == 'bn' else 'English'}."
    
    system_msg = f"""You are KrishkAI, a knowledgeable and friendly farming assistant for Indian farmers. You help with:
- Crop selection and farming practices
- Pest and disease management
- Soil health and fertilizer advice
- Weather-related farming guidance
- Government schemes for farmers (PM-Kisan, PMFBY, etc.)
- Market prices and selling strategies
- Organic farming techniques
- Water management and irrigation
- Post-harvest management

{lang_instruction}
Be concise, practical, and easy to understand. Use simple language. If asked about non-farming topics, politely redirect to farming-related advice."""

    # Get chat history for context
    history = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(20)
    
    context = ""
    if history:
        for msg in history[-10:]:
            context += f"\nUser: {msg.get('user_message', '')}\nAssistant: {msg.get('ai_response', '')}"
    
    full_message = f"{context}\n\nUser: {data.message}" if context else data.message

    response = await get_ai_response(system_msg, full_message, session_id=session_id)
    
    # Store message
    msg_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_message": data.message,
        "ai_response": response,
        "language": data.language,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(msg_doc)
    
    return {"success": True, "response": response, "session_id": session_id}

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"messages": messages}

@api_router.delete("/chat/clear/{session_id}")
async def clear_chat(session_id: str):
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"success": True}

# ============== CREDIT SCORING ==============

@api_router.post("/credit/assess")
async def credit_assess(data: CreditScoreRequest):
    # Rule-based credit scoring algorithm
    score = 0.0
    breakdown = {}
    
    # 1. Income Score (25%)
    if data.annual_income >= 500000:
        income_score = 25
    elif data.annual_income >= 300000:
        income_score = 20
    elif data.annual_income >= 150000:
        income_score = 15
    elif data.annual_income >= 80000:
        income_score = 10
    else:
        income_score = 5
    breakdown["income_score"] = income_score
    score += income_score
    
    # 2. Land Holding Score (20%)
    if data.land_area_acres >= 10:
        land_score = 20
    elif data.land_area_acres >= 5:
        land_score = 16
    elif data.land_area_acres >= 2:
        land_score = 12
    elif data.land_area_acres >= 1:
        land_score = 8
    else:
        land_score = 4
    breakdown["land_score"] = land_score
    score += land_score
    
    # 3. Experience Score (15%)
    if data.farming_experience_years >= 15:
        exp_score = 15
    elif data.farming_experience_years >= 10:
        exp_score = 12
    elif data.farming_experience_years >= 5:
        exp_score = 9
    elif data.farming_experience_years >= 2:
        exp_score = 6
    else:
        exp_score = 3
    breakdown["experience_score"] = exp_score
    score += exp_score
    
    # 4. Loan History Score (20%)
    if data.previous_loans == 0:
        loan_score = 12  # No history - neutral
    elif data.loan_repaid >= data.previous_loans:
        loan_score = 20  # Perfect repayment
    elif data.previous_loans > 0:
        repay_ratio = data.loan_repaid / data.previous_loans
        loan_score = int(20 * repay_ratio)
    else:
        loan_score = 5
    breakdown["loan_history_score"] = loan_score
    score += loan_score
    
    # 5. Investment & Savings Score (10%)
    total_assets = data.investment_amount + data.savings
    if total_assets >= 200000:
        asset_score = 10
    elif total_assets >= 100000:
        asset_score = 8
    elif total_assets >= 50000:
        asset_score = 6
    elif total_assets >= 20000:
        asset_score = 4
    else:
        asset_score = 2
    breakdown["asset_score"] = asset_score
    score += asset_score
    
    # 6. Crop Diversification Score (10%)
    crop_types = [c.strip() for c in data.crop_type.split(",") if c.strip()]
    if len(crop_types) >= 3:
        crop_score = 10
    elif len(crop_types) == 2:
        crop_score = 7
    elif len(crop_types) == 1:
        crop_score = 5
    else:
        crop_score = 2
    breakdown["crop_score"] = crop_score
    score += crop_score
    
    # Determine eligibility
    if score >= 70:
        eligibility = "Highly Eligible"
        max_loan = data.annual_income * 3
        interest_range = "7-9%"
    elif score >= 55:
        eligibility = "Eligible"
        max_loan = data.annual_income * 2
        interest_range = "9-12%"
    elif score >= 40:
        eligibility = "Conditionally Eligible"
        max_loan = data.annual_income * 1
        interest_range = "12-15%"
    else:
        eligibility = "Needs Improvement"
        max_loan = data.annual_income * 0.5
        interest_range = "15-18%"
    
    # Recommendations
    recommendations = []
    if income_score < 15:
        recommendations.append("Consider crop diversification to increase income")
    if land_score < 12:
        recommendations.append("Explore leasing additional farmland")
    if exp_score < 9:
        recommendations.append("Attend government agricultural training programs")
    if loan_score < 12:
        recommendations.append("Improve loan repayment history for better rates")
    if asset_score < 6:
        recommendations.append("Build savings through a Kisan Credit Card")
    
    # Suggested government schemes
    schemes = []
    if data.annual_income < 600000:
        schemes.append({"name": "PM-Kisan", "benefit": "₹6,000/year direct benefit"})
    if data.land_area_acres <= 5:
        schemes.append({"name": "PMFBY", "benefit": "Crop insurance at subsidized premium"})
    schemes.append({"name": "Kisan Credit Card", "benefit": f"Credit up to ₹{int(max_loan):,} at {interest_range} interest"})
    schemes.append({"name": "NABARD Refinance", "benefit": "Long-term agricultural loans"})
    
    result = {
        "credit_score": round(score),
        "max_score": 100,
        "eligibility": eligibility,
        "max_loan_amount": round(max_loan),
        "interest_range": interest_range,
        "breakdown": breakdown,
        "recommendations": recommendations,
        "government_schemes": schemes
    }
    
    # Store assessment
    assess_doc = {
        "id": str(uuid.uuid4()),
        "input": data.dict(),
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.credit_assessments.insert_one(assess_doc)
    
    return {"success": True, "data": result}

# ============== KNOWLEDGE BASE ==============

@api_router.get("/knowledge/base")
async def get_knowledge_base():
    return {
        "categories": [
            {
                "id": "crop_guide",
                "title": "Crop Guide",
                "title_hi": "फसल गाइड",
                "icon": "leaf",
                "items": [
                    {"title": "Rice (धान)", "content": "Best grown in alluvial soil with 20-37°C temperature and 100-200cm rainfall. Kharif season crop. Key varieties: Basmati, IR-36, Pusa-44."},
                    {"title": "Wheat (गेहूं)", "content": "Rabi season crop. Requires loamy soil, 10-25°C temperature, and 50-75cm rainfall. Varieties: HD-2967, PBW-343, DBW-17."},
                    {"title": "Cotton (कपास)", "content": "Kharif crop needing black soil, 21-30°C temperature, and 50-100cm rainfall. Bt Cotton varieties are popular."},
                    {"title": "Sugarcane (गन्ना)", "content": "Tropical crop. Needs deep rich loamy soil, 21-27°C, and 75-150cm rainfall. Plant in February-March."},
                    {"title": "Maize (मक्का)", "content": "Versatile crop growing in all seasons. Sandy loam soil, 21-27°C, 50-100cm rainfall. Key varieties: HQPM-1, DHM-117."},
                    {"title": "Pulses (दालें)", "content": "Moong, Arhar, Chana - important protein crops. Light loamy soil, moderate water. Fix nitrogen naturally."},
                    {"title": "Vegetables (सब्जियां)", "content": "Tomato, Potato, Onion, Brinjal - high demand crops. Require well-drained soil and regular irrigation."},
                    {"title": "Spices (मसाले)", "content": "Turmeric, Chilli, Cumin - high value crops. Well-drained soil, warm climate. Good export potential."}
                ]
            },
            {
                "id": "soil_health",
                "title": "Soil Health",
                "title_hi": "मिट्टी का स्वास्थ्य",
                "icon": "earth",
                "items": [
                    {"title": "Soil Testing", "content": "Get soil tested every 2 years from nearest KVK or soil testing lab. Tests NPK, pH, organic carbon, and micronutrients."},
                    {"title": "pH Management", "content": "Ideal pH: 6.0-7.5. Add lime for acidic soil, gypsum for alkaline soil. Test before correcting."},
                    {"title": "Organic Matter", "content": "Add compost, FYM, or vermicompost to improve soil organic carbon. Target: 0.5% or above."},
                    {"title": "Mulching", "content": "Use crop residue or plastic mulch to retain moisture, control weeds, and moderate soil temperature."},
                    {"title": "Green Manuring", "content": "Grow dhaincha, sunhemp before main crop. Plough in at flowering stage. Adds nitrogen naturally."}
                ]
            },
            {
                "id": "pest_control",
                "title": "Pest Control",
                "title_hi": "कीट नियंत्रण",
                "icon": "bug",
                "items": [
                    {"title": "IPM Approach", "content": "Integrated Pest Management: Use biological, cultural, and chemical methods together. Minimize pesticide use."},
                    {"title": "Neem-based Solutions", "content": "Neem oil spray (5ml/litre) effective against aphids, whitefly, and many caterpillars. Apply in evening."},
                    {"title": "Biological Control", "content": "Use Trichogramma cards for stem borers, Beauveria for white grubs, Trichoderma for soil diseases."},
                    {"title": "Safe Pesticide Use", "content": "Read labels carefully. Wear PPE. Follow waiting period. Don't spray during flowering. Dispose containers safely."},
                    {"title": "Trap Crops", "content": "Plant marigold near tomatoes, mustard near cabbage to attract pests away from main crop."}
                ]
            },
            {
                "id": "govt_schemes",
                "title": "Government Schemes",
                "title_hi": "सरकारी योजनाएं",
                "icon": "business",
                "items": [
                    {"title": "PM-Kisan", "content": "₹6,000/year in 3 installments to all farmer families. Register at pmkisan.gov.in with Aadhaar."},
                    {"title": "PMFBY", "content": "Pradhan Mantri Fasal Bima Yojana - Crop insurance at 2% premium for Kharif, 1.5% for Rabi. Claim via bank."},
                    {"title": "Kisan Credit Card", "content": "Loan up to ₹3 lakh at 4% interest (with subsidy). Apply at nearest bank with land records."},
                    {"title": "Soil Health Card", "content": "Free soil testing and recommendations. Apply at nearest agriculture office or soilhealth.dac.gov.in"},
                    {"title": "e-NAM", "content": "Online trading portal for agricultural commodities. Register at enam.gov.in. Get better prices."},
                    {"title": "PM Kisan Samman Nidhi", "content": "Direct income support. Check eligibility and status at pmkisan.gov.in"},
                    {"title": "Subsidy on Equipment", "content": "40-50% subsidy on farm equipment through various state schemes. Apply at district agriculture office."}
                ]
            },
            {
                "id": "water_mgmt",
                "title": "Water Management",
                "title_hi": "जल प्रबंधन",
                "icon": "water",
                "items": [
                    {"title": "Drip Irrigation", "content": "Saves 30-60% water. Government provides 55-90% subsidy. Best for horticulture crops. Contact GGRC."},
                    {"title": "Sprinkler System", "content": "Suitable for field crops. 30-50% water savings. Subsidy available through PMKSY."},
                    {"title": "Rainwater Harvesting", "content": "Build farm ponds, check dams. MGNREGA funds available. Store monsoon water for Rabi season."},
                    {"title": "Furrow Irrigation", "content": "Better than flood irrigation. Make channels between crop rows. Saves 25% water."}
                ]
            },
            {
                "id": "organic_farming",
                "title": "Organic Farming",
                "title_hi": "जैविक खेती",
                "icon": "nutrition",
                "items": [
                    {"title": "Getting Started", "content": "Transition takes 2-3 years. Start with one plot. Reduce chemicals gradually. Get PGS certification."},
                    {"title": "Composting", "content": "Mix crop residue, cow dung, and green waste. Turn every 15 days. Ready in 3-4 months."},
                    {"title": "Vermicompost", "content": "Use Eisenia fetida earthworms. Feed kitchen/farm waste. Harvest in 45-60 days. Rich in nutrients."},
                    {"title": "Jeevamrutha", "content": "Mix 10kg cow dung, 5L cow urine, 2kg jaggery, 2kg pulse flour in 200L water. Ferment 48hrs. Apply weekly."},
                    {"title": "Bio-pesticides", "content": "Neem oil, Dashparni Ark, Cow urine spray - effective organic pest management solutions."}
                ]
            }
        ]
    }

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "KrishkAI API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router
app.include_router(api_router)

# Include marketplace router
from marketplace import market_router
app.include_router(market_router)

# Stripe webhook (must be outside market_router for direct path match)
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    stripe_webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    try:
        # Verify webhook signature if secret is set
        if stripe_webhook_secret:
            event = stripe.Webhook.construct_event(body, sig, stripe_webhook_secret)
        else:
            # No secret set - parse event directly (not recommended for production)
            event = stripe.Event.construct_from(
                json.loads(body), stripe.api_key
            )

        logger.info(f"Stripe webhook: {event['type']}")

        # Handle successful payment
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session["id"]
            payment_status = session.get("payment_status", "")

            if payment_status == "paid":
                tx = await db.payment_transactions.find_one({"session_id": session_id})
                if tx and tx.get("payment_status") != "paid":
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {"payment_status": "paid"}}
                    )
                    order_id = tx.get("order_id") or session.get("metadata", {}).get("order_id")
                    if order_id:
                        await db.orders.update_one(
                            {"id": order_id},
                            {
                                "$set": {"payment_status": "paid", "status": "confirmed"},
                                "$push": {"tracking": {
                                    "status": "Payment Received",
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "note": "Webhook confirmed"
                                }}
                            }
                        )

        return {"received": True}

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"received": True}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
