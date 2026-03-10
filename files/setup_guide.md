# 🐟 AquaFresh – Smart Fish Marketplace
## Complete Setup Guide

---

## 📁 Project Structure

```
aquafresh/
├── frontend/                  # React App (runs standalone)
│   └── src/
│       ├── App.jsx            # Main router
│       ├── context/           # Global state (AppContext)
│       ├── pages/             # All page components
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx  # OTP phone login
│       │   ├── RoleSelectPage.jsx
│       │   ├── HomePage.jsx   # Marketplace (like Blinkit)
│       │   ├── ProductDetailPage.jsx
│       │   ├── CartPage.jsx
│       │   ├── CheckoutPage.jsx  # Token payment
│       │   ├── ProfilePage.jsx
│       │   └── SellerDashboard.jsx
│       ├── components/        # Reusable components
│       │   ├── FishCard.jsx
│       │   ├── BottomNav.jsx
│       │   ├── FilterPanel.jsx
│       │   └── Toast.jsx
│       └── styles/
│           └── globals.css
│
├── backend/                   # FastAPI Backend
│   ├── main.py                # Entry point
│   └── routes/
│       ├── auth.py            # Phone OTP auth
│       ├── fish.py            # Fish listings CRUD
│       ├── orders.py          # Order management
│       ├── sellers.py         # Seller profiles
│       └── ai_pricing.py      # ML price prediction API
│
├── ml_model/
│   └── price_prediction.py    # scikit-learn RF model
│
├── database/
│   ├── schema.sql             # PostgreSQL schema
│   └── seed_data.sql          # Sample data
│
├── docker/
│   └── docker-compose.yml     # Full stack deployment
│
└── docs/
    └── setup_guide.md         # This file
```

---

## 🚀 Option 1: Run Frontend Only (Quickest Start)

The React frontend is fully functional standalone – no backend needed for demo!

### Prerequisites
- Node.js 18+ and npm

### Steps

```bash
# 1. Navigate to frontend
cd aquafresh/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# OR with Vite:
npm run dev

# 4. Open browser
# → http://localhost:3000
```

### What you'll see:
1. **Splash screen** → auto-navigates to login
2. **Phone login** → enter any 10 digits + any 4-digit OTP
3. **Role selection** → choose Buyer or Seller
4. **Marketplace** → browse, search, filter, add to cart
5. **Checkout** → dummy payment with token booking
6. **Seller dashboard** → add fish, order supplies

---

## 🐍 Option 2: Run Full Stack

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
# Navigate to backend
cd aquafresh/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-jose passlib psycopg2-binary
pip install pydantic python-multipart sqlalchemy

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/aquafresh"
export SECRET_KEY="your-secret-key"

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API Docs available at: http://localhost:8000/docs
```

### ML Model Setup

```bash
cd aquafresh/ml_model

# Install ML dependencies
pip install scikit-learn pandas numpy

# Train the model (generates price_model.pkl)
python price_prediction.py

# Expected output:
# ✅ Training data: 3000 records
# 📊 Model Performance:
#    MAE: ~₹45
#    R² Score: ~0.94
```

### Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE aquafresh;"

# Run schema
psql -U postgres -d aquafresh -f database/schema.sql

# Load seed data
psql -U postgres -d aquafresh -f database/seed_data.sql
```

---

## 🐳 Option 3: Docker (Full Production Stack)

```bash
# From project root
cd aquafresh

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Services:
# → React Frontend:  http://localhost:3000
# → FastAPI Backend: http://localhost:8000
# → API Docs:        http://localhost:8000/docs
# → PostgreSQL:      localhost:5432
# → Redis:           localhost:6379

# Stop services
docker-compose -f docker/docker-compose.yml down
```

---

## 🗺️ Google Maps Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** and **Geocoding API**
3. Create an API key
4. Add to frontend `.env`:
   ```
   REACT_APP_GOOGLE_MAPS_KEY=your_key_here
   ```
5. The "View on Google Maps" button will open real map locations

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP, get token |
| POST | `/api/auth/set-role` | Set buyer/seller role |
| GET | `/api/fish/` | List all fish (with filters) |
| GET | `/api/fish/{id}` | Get fish details |
| POST | `/api/fish/` | Add fish listing (seller) |
| PUT | `/api/fish/{id}/price` | Update fish price |
| GET | `/api/fish/top-picks/list` | Top picks |
| GET | `/api/fish/best-deals/list` | Best deals |
| POST | `/api/orders/` | Create order + token |
| GET | `/api/orders/user/{id}` | User order history |
| POST | `/api/orders/{id}/rate` | Rate fish |
| GET | `/api/sellers/` | List sellers |
| POST | `/api/ai/predict-price` | AI price prediction |
| GET | `/api/ai/market-trends` | Market trends |

### Example API Request

```bash
# Send OTP
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Get fish with filters
curl "http://localhost:8000/api/fish/?category=Prawns&max_price=1000&min_rating=4.5"

# AI price prediction
curl -X POST http://localhost:8000/api/ai/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "fish_type": "Salmon",
    "freshness": 95,
    "stock_remaining": 5,
    "demand_score": 0.9,
    "hour_of_day": 7
  }'
```

---

## ✨ Features Implemented

### Frontend (React)
- [x] Animated landing/splash page
- [x] Phone OTP login simulation
- [x] Role selection (Buyer / Seller)
- [x] Blinkit-style home marketplace
- [x] Voice search (Web Speech API)
- [x] Fuzzy search with suggestions
- [x] Filter panel (price, rating, distance, type)
- [x] Category tabs + type tags
- [x] Fish cards with freshness indicators
- [x] Product detail page with tabs
- [x] AI dynamic price display
- [x] Add to cart with quantity selector
- [x] Cart page with summary
- [x] Token booking payment flow
- [x] Dummy payment gateway (4 methods)
- [x] Token ID generation on success
- [x] First 3 orders discount system
- [x] Profile page with order history
- [x] Fish rating modal (freshness/taste/overall)
- [x] Seller dashboard with stats
- [x] Add fish listing form
- [x] Supply marketplace (ice, boxes, etc.)
- [x] Google Maps link integration
- [x] Toast notifications
- [x] Responsive mobile-first design

### Backend (FastAPI)
- [x] Phone OTP auth flow
- [x] Fish CRUD with filtering
- [x] Order management + token generation
- [x] Seller profiles
- [x] AI pricing endpoint

### ML Model (scikit-learn)
- [x] Random Forest price prediction
- [x] Freshness, demand, stock, time factors
- [x] Weekend/seasonal adjustments
- [x] Rule-based fallback

### Database (PostgreSQL)
- [x] Full normalized schema
- [x] Users, sellers, listings, orders
- [x] Ratings, loyalty points
- [x] Supply marketplace
- [x] AI price logging
- [x] Sample seed data

---

## 🔧 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS3, Web Speech API |
| Backend | Python 3.10, FastAPI, Uvicorn |
| Database | PostgreSQL 15 + PostGIS |
| Cache | Redis |
| ML/AI | scikit-learn, pandas, numpy |
| Maps | Google Maps API |
| Deployment | Docker + Docker Compose |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 📞 Support
**Customer Care:** +91 1800-AQUA-123  
**Email:** help@aquafresh.in  
**Made with ❤️ for Indian fishermen and seafood lovers**
