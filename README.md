# ZYNC — AI-Powered Product Recommendation Engine 🤖🛍️

> A full-stack ecommerce application with a machine learning recommendation engine that learns from user behaviour and delivers personalised product suggestions in real time.

![Python](https://img.shields.io/badge/Python-3.14-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.3-orange?style=flat-square&logo=scikit-learn)
![Pandas](https://img.shields.io/badge/Pandas-2.1-purple?style=flat-square&logo=pandas)

---

## 🚀 Live Demo

> > 🌐 **Live:** https://ai-store-1wcn.onrender.com

---

## 📸 Features

| Feature | Description |
|---|---|
| 🤖 AI Recommendations | Cosine similarity + collaborative filtering |
| 🎯 Personalised Feed | Homepage updates based on your behaviour |
| 🔍 Smart Search | Live search with instant dropdown results |
| 🛒 Cart & Checkout | Full checkout with Card, UPI & Net Banking |
| ❤️ Wishlist | Save products for later |
| 📦 Order History | Track all past orders with tracking numbers |
| 👤 Auth System | Register, Login, Logout with session management |
| 🌙☀️ Dark/Light Theme | Toggle between dark and warm cream themes |
| 🔽 Filter & Sort | By category, brand, price range, rating |
| ⭐ Reviews | Write and read product reviews |

---

## 🧠 How the AI Works

```
User browses / likes / adds to cart / buys
              ↓
Behaviour tracked with weighted scores
  view=1pt  like=3pts  cart=5pts  buy=10pts
              ↓
Content-based filtering (cosine similarity)
  Tags × 2.0 + Category × 1.5 + Brand × 1.0
              ↓
Collaborative boost from past interactions
              ↓
"You might also like..." 🎯
```

The model gets smarter the more you interact — just like Amazon or Flipkart.

---

## 🗂️ Project Structure

```
ai-store/
├── app.py                  # Flask backend — all API routes
├── ml/
│   └── recommender.py      # AI engine (cosine similarity + collaborative)
├── data/
│   └── products.py         # 51 products across 8 categories
├── static/
│   └── index.html          # Full frontend (HTML + CSS + JS)
├── requirements.txt
└── .gitignore
```

---

## ⚙️ Tech Stack

**Backend**
- Python 3.14
- Flask 3.0
- Flask-CORS

**Machine Learning**
- Scikit-learn (cosine similarity, MultiLabelBinarizer)
- Pandas (data manipulation)
- NumPy (matrix operations)

**Frontend**
- Vanilla HTML, CSS, JavaScript
- DM Serif Display + DM Sans fonts
- CSS custom properties for theming

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.10+
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Pranjalhiray/ai.store.git
cd ai.store

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the app
python app.py
```

### Open in browser
```
http://localhost:5000
```

### Demo Account
```
Email:    test@demo.com
Password: demo123
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | All products (filter, sort, paginate) |
| GET | `/api/products/:id` | Single product details |
| GET | `/api/search?q=` | Search products |
| GET | `/api/recommendations/:id` | AI recommendations for a product |
| GET | `/api/feed` | Personalised homepage feed |
| GET | `/api/trending` | Trending products |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add to cart |
| POST | `/api/checkout` | Place order (Card/UPI/NetBanking) |
| GET | `/api/orders` | Order history |
| POST | `/api/wishlist/:id` | Toggle wishlist |

---

## 🗃️ Product Categories

- 👟 **Shoes** — Nike, Adidas, Jordan, Converse, Vans
- 👕 **Clothing** — Levi's, H&M, Zara, The North Face
- 📱 **Electronics** — Apple, Sony, Samsung, DJI, Logitech
- 🏋️ **Sports** — Fitbit, Garmin, Bowflex, Hydro Flask
- 👜 **Bags** — Herschel, Bellroy, Peak Design
- 💄 **Beauty** — Dyson, Foreo, The Ordinary
- 🏠 **Home** — Philips, Nespresso, Instant Pot
- 🎮 **Gaming** — PlayStation, Razer, Nintendo, SteelSeries
- 📚 **Books** — Atomic Habits, Clean Code, Psychology of Money
- 💊 **Health** — Optimum Nutrition, AG1, Celsius

---

## 🔮 Roadmap

- [ ] MongoDB integration (persistent storage)
- [ ] Deploy on Render.com
- [ ] User browsing history visualisation
- [ ] Email order confirmation
- [ ] Admin dashboard
- [ ] More products & categories

---

## 👨‍💻 Author

**Pranjal Hiray**
- GitHub: [@Pranjalhiray](https://github.com/Pranjalhiray)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with ❤️ + 🤖 AI · Flask · Scikit-learn · Vanilla JS
