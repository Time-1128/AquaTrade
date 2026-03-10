"""
AI Pricing Routes – Uses ML model for dynamic price prediction
"""

from fastapi import APIRouter
from pydantic import BaseModel
router = APIRouter()

class PricingRequest(BaseModel):
    fish_type: str
    freshness: int       # 0-100
    stock_remaining: int
    demand_score: float  # 0-1
    hour_of_day: int

@router.post("/predict-price")
def predict_price(req: PricingRequest):
    """Predict optimal fish price using AI model"""
    # Import here to avoid loading on startup if model isn't ready
    try:
        from ..ai_pricing.price_prediction import predict
        predicted = predict(req.fish_type, req.freshness, req.stock_remaining, req.demand_score, req.hour_of_day)
    except Exception:
        # Fallback rule-based pricing
        base_prices = {"Salmon": 850, "Tuna": 1200, "Prawns": 680, "Crab": 920, "Pomfret": 760, "default": 500}
        base = base_prices.get(req.fish_type, base_prices["default"])
        freshness_mult = req.freshness / 100
        demand_mult = 0.9 + req.demand_score * 0.2
        stock_mult = 1.1 if req.stock_remaining < 5 else 0.95 if req.stock_remaining > 20 else 1.0
        time_mult = 1.08 if 17 <= req.hour_of_day <= 20 else 1.05 if 6 <= req.hour_of_day <= 10 else 1.0
        predicted = round(base * freshness_mult * demand_mult * stock_mult * time_mult)

    return {
        "fish_type": req.fish_type,
        "predicted_price": predicted,
        "factors": {
            "freshness": req.freshness,
            "stock_pressure": "high" if req.stock_remaining < 5 else "low",
            "demand": "high" if req.demand_score > 0.7 else "normal",
            "peak_hours": 6 <= req.hour_of_day <= 10 or 17 <= req.hour_of_day <= 20
        }
    }

@router.get("/market-trends")
def market_trends():
    """Get current market trends"""
    return {
        "trending": ["Hilsa", "Tiger Prawns", "Pomfret"],
        "high_demand": ["Live Lobster", "Salmon"],
        "best_value": ["Sardine", "Mackerel", "Catla"],
        "price_alerts": [
            {"fish": "Pomfret", "trend": "up", "change": "+12%"},
            {"fish": "Sardine", "trend": "down", "change": "-5%"}
        ]
    }
