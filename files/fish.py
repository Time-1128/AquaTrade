"""
Fish Listing Routes
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# Sample data (replace with DB queries in production)
FISH_DB = [
    {"id": 1, "name": "Atlantic Salmon", "type": "Sea water", "category": "Fish",
     "price": 850, "rating": 4.8, "freshness": 95, "stock": 12, "sellerId": 1,
     "sellerName": "Rajan's Fresh Catch", "sellerDist": 1.2, "eta": "12 min", "discount": 15},
    {"id": 2, "name": "Tiger Prawns", "type": "Sea water", "category": "Prawns",
     "price": 680, "rating": 4.9, "freshness": 97, "stock": 15, "sellerId": 1,
     "sellerName": "Rajan's Fresh Catch", "sellerDist": 1.2, "eta": "12 min", "discount": 13},
    {"id": 3, "name": "Blue Swimming Crab", "type": "Sea water", "category": "Crab",
     "price": 920, "rating": 4.7, "freshness": 89, "stock": 6, "sellerId": 2,
     "sellerName": "Harbor Fresh", "sellerDist": 3.5, "eta": "28 min", "discount": 12},
    {"id": 4, "name": "Pomfret (Silver)", "type": "Sea water", "category": "Fish",
     "price": 760, "rating": 4.8, "freshness": 94, "stock": 10, "sellerId": 1,
     "sellerName": "Rajan's Fresh Catch", "sellerDist": 1.2, "eta": "12 min", "discount": 16},
]

class FishListing(BaseModel):
    name: str
    type: str
    category: str
    price: float
    stock: float
    freshness: int
    description: Optional[str] = ""
    sellerId: int
    location: Optional[dict] = None

@router.get("/")
def get_all_fish(
    category: Optional[str] = None,
    water_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    max_distance: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0
):
    """Get all fish with optional filters"""
    results = FISH_DB[:]
    if category and category != "All":
        results = [f for f in results if f["category"] == category]
    if water_type and water_type != "All":
        results = [f for f in results if f["type"] == water_type]
    if min_price:
        results = [f for f in results if f["price"] >= min_price]
    if max_price:
        results = [f for f in results if f["price"] <= max_price]
    if min_rating:
        results = [f for f in results if f["rating"] >= min_rating]
    if max_distance:
        results = [f for f in results if f["sellerDist"] <= max_distance]
    if search:
        results = [f for f in results if search.lower() in f["name"].lower()]
    return {"total": len(results), "items": results[offset:offset + limit]}

@router.get("/{fish_id}")
def get_fish(fish_id: int):
    """Get fish by ID"""
    fish = next((f for f in FISH_DB if f["id"] == fish_id), None)
    if not fish:
        raise HTTPException(status_code=404, detail="Fish not found")
    return fish

@router.post("/")
def add_fish(fish: FishListing):
    """Add new fish listing (seller only)"""
    new_id = max(f["id"] for f in FISH_DB) + 1
    new_fish = {"id": new_id, **fish.dict(), "rating": 0.0, "reviews": 0}
    FISH_DB.append(new_fish)
    return {"message": "Fish listed successfully", "id": new_id, "fish": new_fish}

@router.put("/{fish_id}/price")
def update_price(fish_id: int, price: float):
    """Update fish price"""
    fish = next((f for f in FISH_DB if f["id"] == fish_id), None)
    if not fish:
        raise HTTPException(status_code=404, detail="Fish not found")
    fish["price"] = price
    return {"message": "Price updated", "new_price": price}

@router.put("/{fish_id}/stock")
def update_stock(fish_id: int, stock: float):
    """Update available stock"""
    fish = next((f for f in FISH_DB if f["id"] == fish_id), None)
    if not fish:
        raise HTTPException(status_code=404, detail="Fish not found")
    fish["stock"] = stock
    return {"message": "Stock updated", "remaining": stock}

@router.get("/top-picks/list")
def top_picks():
    """Get top picked fish"""
    return sorted(FISH_DB, key=lambda f: f["rating"], reverse=True)[:6]

@router.get("/best-deals/list")
def best_deals():
    """Get best deals"""
    return sorted(FISH_DB, key=lambda f: f.get("discount", 0), reverse=True)[:6]
