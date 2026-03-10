"""Orders Routes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

router = APIRouter()
ORDERS_DB = []

class OrderItem(BaseModel):
    fishId: int
    fishName: str
    qty: float
    price: float

class OrderCreate(BaseModel):
    userId: str
    items: List[OrderItem]
    address: str
    paymentMethod: str
    timeSlot: str

@router.post("/")
def create_order(order: OrderCreate):
    token_id = f"TKN{random.randint(100000, 999999)}"
    subtotal = sum(i.price * i.qty for i in order.items)
    new_order = {
        "id": token_id,
        "userId": order.userId,
        "items": [i.dict() for i in order.items],
        "address": order.address,
        "paymentMethod": order.paymentMethod,
        "timeSlot": order.timeSlot,
        "subtotal": subtotal,
        "bookingFee": 50,
        "total": subtotal + 50,
        "status": "Confirmed",
        "createdAt": datetime.now().isoformat()
    }
    ORDERS_DB.append(new_order)
    return {"message": "Order confirmed", "tokenId": token_id, "order": new_order}

@router.get("/user/{user_id}")
def get_user_orders(user_id: str):
    return [o for o in ORDERS_DB if o["userId"] == user_id]

@router.get("/{order_id}")
def get_order(order_id: str):
    order = next((o for o in ORDERS_DB if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/{order_id}/rate")
def rate_order(order_id: str, fish_id: int, freshness: int, taste: int, overall: int):
    return {"message": "Rating submitted", "orderId": order_id, "ratings": {"freshness": freshness, "taste": taste, "overall": overall}}
