"""
AquaFresh – Smart Fish Marketplace
FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn

# Import route modules (from current folder)
import auth
import fish
import orders
import sellers
import ai_pricing

app = FastAPI(
    title="AquaFresh API",
    description="Smart Fish Marketplace – Connecting buyers with local fishermen",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(fish.router, prefix="/api/fish", tags=["Fish Listings"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(sellers.router, prefix="/api/sellers", tags=["Sellers"])
app.include_router(ai_pricing.router, prefix="/api/ai", tags=["AI Pricing"])


@app.get("/")
def root():
    return {
        "app": "AquaFresh – Smart Fish Marketplace",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "message": "Backend is working"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)