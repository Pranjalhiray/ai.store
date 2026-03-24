# 🛍️ ZYNC — AI-Powered Ecommerce Store

<div align="center">

**India's smartest AI-powered ecommerce platform built with React, Flask, PostgreSQL & LLaMA 3.3**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-green?logo=flask)](https://flask.palletsprojects.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql)](https://postgresql.org)
[![Groq](https://img.shields.io/badge/AI-LLaMA%203.3%2070B-orange)](https://groq.com)

</div>

---

HERE'S A LIVE:- https://ai-store-1wcn.onrender.com/

## ✨ Features

### 🤖 AI Features (Powered by LLaMA 3.3 70B via Groq)
- 💬 AI Shopping Assistant — Natural language product discovery
- 🗣️ Alex — Personal Shopper that remembers preferences
- 🎯 Gift Finder — Quiz-based gift recommendations
- ✨ Style Advisor — Complete outfit generator
- 🔍 AI Smart Search — Natural language search
- 🎲 Surprise Me — Random curated product discovery
- 🧬 Style DNA — Permanent style identity analysis
- 💰 Deal Sniper — Best value products across 470+ items
- 🛒 Shopping Coach — Cart analysis and optimization
- 🎉 Occasion Planner — Event-based shopping guide
- 😊 Emotion Analyzer — Sentiment analysis on reviews
- 🏆 Shopping Goals — Phased shopping plan creator
- 📊 Price Analyzer — Value scoring and comparison

### 🛒 Store Features
- 🖼️ Visual Search — Upload image to find similar products
- 🎤 Voice Search — Speak to search (en-IN optimized)
- 🎠 Hero Slider — Auto-sliding banner with 4 slides
- ⚡ Flash Sale — Live countdown timer
- 📊 AI Analytics Dashboard — Charts with recharts
- 🛡️ Admin Dashboard — Manage orders, users, products
- 📱 Mobile Responsive — Hamburger menu, responsive grids
- 🔔 Notification Center — Real-time alerts
- 🌙 Dark/Light Theme — Toggle with persistence
- 💳 Full Checkout — Card, UPI, Net Banking, COD

### 🗄️ Technical Stack
- **Frontend:** React 18 + Vite, React Router, Recharts, Framer Motion
- **Backend:** Python Flask, PostgreSQL (Neon), psycopg2
- **AI:** Groq API (LLaMA 3.3 70B) — 14,400 free requests/day
- **ML:** Scikit-learn cosine similarity recommendations
- **Database:** PostgreSQL 17 via Neon (free tier)
- **Deployment:** Render.com

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Neon free account)
- Groq API key (free at console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/Pranjalhiray/ai.store.git
cd ai.store

# Backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Environment Setup

Create `.env` in root:
```env
SECRET_KEY=zync-ai-store-secret-2024
GROQ_API_KEY=your_groq_key_here
DATABASE_URL=your_neon_postgresql_url
```

### 3. Run

```bash
# Terminal 1 - Backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

---

## 📁 Project Structure

```
ai-store/
├── app.py                 # Flask backend (all API routes)
├── wsgi.py                # Gunicorn entry point
├── Procfile               # Render deployment
├── requirements.txt
├── data/
│   └── products.py        # 470 products across 10 categories
├── ml/
│   └── recommender.py     # ML recommendation engine
└── frontend/              # React app
    └── src/
        ├── pages/         # Home, Shop, ProductDetail, Checkout...
        ├── components/    # Navbar, ProductCard, CartDrawer...
        └── context/       # AppContext (global state)
```

---

## 🌐 Deployment (Render)

1. Push to GitHub
2. Create Web Service on Render
3. Set environment variables
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn wsgi:app`

---

## 📦 Product Catalog

470 products across 10 categories:
- 👟 Shoes (58) — Nike, Adidas, Jordan, New Balance
- 👕 Clothing (71) — Zara, H&M, Levi's, Ralph Lauren
- 📱 Electronics (71) — Apple, Samsung, Sony, Bose
- 🏃 Sports (50) — Manduka, Garmin, Wilson, Decathlon
- 👜 Bags (30) — Herschel, Peak Design, Tumi, Samsonite
- 💄 Beauty (40) — Dyson, The Ordinary, FOREO, MAC
- 🏠 Home (40) — Philips, Nespresso, Instant Pot, Dyson
- 🎮 Gaming (30) — Sony, Razer, Nintendo, ASUS ROG
- 📚 Books (40) — Atomic Habits, Psychology of Money
- 💊 Health (40) — Optimum Nutrition, MuscleBlaze, Himalaya

---

## 🤝 Contributing

Built by **Pranjal Hiray** as an AI portfolio project.

---

## 📄 License

MIT License