# KrishkAI - AI-Powered Farming Assistant

## Overview
KrishkAI is an AI-driven agricultural ecosystem mobile app designed for Indian farmers. It provides AI-powered crop recommendations, disease detection, a knowledge hub chatbot, and credit scoring for loan eligibility assessment.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) with expo-router
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **AI**: Gemma-4-26B-A4B-it:novita

## Features

### 1. User Authentication
- Phone-based registration and login
- JWT token authentication
- Profile with state/district info

### 2. AI Crop Recommendation
- Input: terrain type, soil type, temperature, humidity, rainfall, fertilizer, problems
- AI-powered recommendations using GPT-4o
- Returns: best crop, recommended crops, soil tips, water management, fertilizer advice

### 3. AI Disease Detection
- Camera/gallery image upload
- GPT-4o vision analysis for crop disease identification
- Returns: disease name, symptoms, treatment, organic remedies, prevention tips

### 4. Knowledge Hub (AI Chatbot)
- Multi-turn conversation with farming AI assistant
- Quick prompts for common queries
- Covers: crops, pests, schemes, market prices, organic farming

### 5. Credit Scoring / Loan Eligibility
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

## API Endpoints
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

## Color Theme
- Primary: #2E7D32 (Forest Green)
- Secondary: #F9A825 (Harvest Yellow)
- Background: #F1F8E9 (Pale Green)
- Error: #D32F2F

## Test User
- Phone: 9876543210
- Password: test123
