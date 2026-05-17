# 🌾 KrishkAI - AI-Powered Farming Assistant

## Overview
KrishkAI is an AI-driven agricultural ecosystem mobile app designed for Indian farmers. It provides AI-powered crop recommendations, disease detection, a knowledge hub chatbot, and credit scoring for loan eligibility assessment.

---

## 🛠 Tech Stack

| Layer         | Technology                     |
|---------------|---------------------------------|
| **Frontend**  | React Native (Expo SDK 54) with expo-router|
| **Backend**   | Python FastAPI|
| **AI-Model**  | Gemma-4-26B-A4B-it:novita|
| **Database**  | MongoDB |

---

## ⚙️ Setup Instructions
- **1. Clone the Repository**
  ```bash
  git clone https://github.com/Trambak4920/KrishkAI.git
  cd KrishkAI
  ```
  
- **2. Start the Backend (in 1st Terminal)**
  ```bash
  cd ../backend
  pip install -r requirements.txt
  python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
  ```

- **3. Start the Frontend (in 2nd Terminal)**
  ```bash
  cd ../frontend
  npm install
  npx expo start --clear
  ```

---

## 🚀 Features

### 1. 👤 User Authentication
- Phone-based registration and login
- JWT token authentication
- Profile with state/district info

### 2. 🌱 AI Crop Recommendation
- Input: terrain type, soil type, temperature, humidity, rainfall, fertilizer, problems
- AI-powered recommendations using GPT-4o
- Returns: best crop, recommended crops, soil tips, water management, fertilizer advice

### 3. 🐛 AI Disease Detection
- Camera/gallery image upload
- GPT-4o vision analysis for crop disease identification
- Returns: disease name, symptoms, treatment, organic remedies, prevention tips

### 4. 🧠 Knowledge Hub (AI Chatbot)
- Multi-turn conversation with farming AI assistant
- Quick prompts for common queries
- Covers: crops, pests, schemes, market prices, organic farming

### 5. 💰 Credit Scoring / Loan Eligibility
- Rule-based scoring algorithm (100-point scale)
- Factors: income, land, experience, loan history, investments, crop diversity
- Returns: score, eligibility, max loan amount, government schemes

### 6. Offline Knowledge Base
- Pre-loaded farming data across 6 categories
- 34+ articles covering crops, soil, pests, schemes, water, organic farming
- Available via GET /api/knowledge/base for client caching

### 7. Multilingual Support
- 7 languages: English, Hindi, Tamil, Telugu, Kannada, Marathi, Bengali
- UI translations for all key labels and buttons
- AI responses in selected language

---

## 🌐 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| GET | /api/auth/profile | Get profile |
| PUT | /api/auth/profile | Update profile |
| POST | /api/crop/recommend | AI crop recommendation |
| POST | /api/disease/detect | AI disease detection |
| POST | /api/chat/message | Chat with AI |
| GET | /api/chat/history/{id} | Get chat history |
| POST | /api/credit/assess | Credit scoring |
| GET | /api/knowledge/base | Offline knowledge data |

---

## 🌩️ Future Developments

### 🧠 Models and Agents Enhancements

- **Credit Scoring 2.0** — The current rule-based credit scoring system will be replaced by a in-built self-runnig lightweight model which will use real agricultural loan data, incorporating satellite land analysis, seasonal crop yield history, and regional market trends for more accurate and fair assessments.

- **Offline AI Models** — Integration of lightweight, on-device AI models for crop disease detection and basic Q&A, enabling farmers in low-connectivity rural areas to access AI features without internet.

- **Crop Yield Prediction** — A dedicated ML model trained on historical yield data, weather patterns, and soil conditions to predict expected harvest yield before the season begins.

- **Voice Input Support** — Speech-to-text integration in regional Indian languages  so farmers can interact with the app hands-free while working in the field.


### 🌾 Feature Enhancements

- **Weather Integration** — Real-time hyperlocal weather forecasts and alerts integrated directly into crop recommendations and advisory notifications.

- **Farm Journal** — A digital farm diary where farmers can log daily activities, input costs, and harvests to track profitability over time.


### 🛒 Marketplace Improvements

- **Auction System** — A real-time bidding/auction feature for bulk crop lots, allowing farmers to get the best competitive price.

- **Quality Grading** — AI-powered image-based crop quality grading at the time of listing, to build buyer trust and enable premium pricing for high-quality produce.

- **Buyer Verification & Ratings** — A two-way rating and review system for buyers and sellers to build trust within the marketplace ecosystem.


### 🔐 Security & Build Enhancements

- **Biometric Authentication** — Fingerprint and face ID login support for faster and more secure access.

- **Multi-factor Authentication (MFA)** — OTP-based login verification via SMS for enhanced account security.

- **Production Cloud Deployment** — Migration to a fully scalable cloud infrastructure (AWS/GCP) with auto-scaling, load balancing, and 99.9% uptime SLA.

- **Data Encryption** — End-to-end encryption for all sensitive farmer data including financial records and personal information.

---

## 🤝 Authors and Team Members
- Trambak Konar
- Esha Halder
- Argha Roy Choudhary
