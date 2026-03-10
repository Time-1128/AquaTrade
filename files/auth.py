"""
Authentication Routes – Phone OTP based login
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import random, time

router = APIRouter()

# In-memory OTP store (use Redis in production)
otp_store = {}

class PhoneRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class UserRole(BaseModel):
    phone: str
    role: str  # "buyer" | "seller"
    location: Optional[dict] = None

@router.post("/send-otp")
def send_otp(req: PhoneRequest):
    """Send OTP to phone number (simulated)"""
    if len(req.phone) != 10 or not req.phone.isdigit():
        raise HTTPException(status_code=400, detail="Invalid phone number")
    otp = str(random.randint(1000, 9999))
    otp_store[req.phone] = {"otp": otp, "expires": time.time() + 300}
    # In production: integrate with Twilio / MSG91
    print(f"[DEMO] OTP for {req.phone}: {otp}")
    return {"message": "OTP sent successfully", "demo_otp": otp}  # Remove demo_otp in production

@router.post("/verify-otp")
def verify_otp(req: OTPVerify):
    """Verify OTP and return auth token"""
    record = otp_store.get(req.phone)
    if not record:
        raise HTTPException(status_code=400, detail="OTP not sent or expired")
    if time.time() > record["expires"]:
        raise HTTPException(status_code=400, detail="OTP expired")
    if record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    # Return mock JWT (use python-jose in production)
    token = f"demo_token_{req.phone}_{int(time.time())}"
    del otp_store[req.phone]
    return {"token": token, "phone": req.phone, "message": "Login successful"}

@router.post("/set-role")
def set_role(req: UserRole):
    """Store user role after login"""
    if req.role not in ["buyer", "seller"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    # In production: save to database
    return {"phone": req.phone, "role": req.role, "message": "Role set successfully"}
