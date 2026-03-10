"""Sellers Routes"""
from fastapi import APIRouter
router = APIRouter()

SELLERS_DB = [
    {"id": 1, "name": "Rajan's Fresh Catch", "phone": "9876543210", "location": {"lat": 13.0827, "lng": 80.2707, "address": "Marina Beach Fish Market"}, "rating": 4.8, "verified": True},
    {"id": 2, "name": "Deep Sea Traders", "phone": "9123456789", "location": {"lat": 13.0569, "lng": 80.2425, "address": "Kasimedu Harbour"}, "rating": 4.6, "verified": True},
]

@router.get("/")
def get_sellers(): return SELLERS_DB

@router.get("/{seller_id}")
def get_seller(seller_id: int):
    s = next((s for s in SELLERS_DB if s["id"] == seller_id), None)
    return s or {"error": "Not found"}
