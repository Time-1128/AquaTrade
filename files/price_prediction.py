"""
AquaFresh AI Price Prediction Module
Uses scikit-learn Random Forest to predict optimal fish prices
based on freshness, demand, stock, time, and fish type.

Usage:
    python price_prediction.py            # Train and test
    from price_prediction import predict  # Import in API
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os

# ─── Base prices by fish type ───────────────────────────────────────────────
BASE_PRICES = {
    "Salmon": 850, "Tuna": 1200, "Mackerel": 320, "Sardine": 180,
    "Pomfret": 760, "Prawns": 680, "Crab": 920, "Lobster": 2400,
    "Hilsa": 1800, "Rohu": 280, "Catla": 240, "Squid": 420,
    "Dried Sardine": 180
}

def generate_training_data(n_samples: int = 2000) -> pd.DataFrame:
    """Generate synthetic training data for price prediction"""
    np.random.seed(42)
    fish_types = list(BASE_PRICES.keys())
    records = []

    for _ in range(n_samples):
        fish = np.random.choice(fish_types)
        freshness = np.random.randint(50, 100)
        stock = np.random.randint(1, 50)
        demand = np.random.uniform(0.1, 1.0)
        hour = np.random.randint(4, 22)
        day_of_week = np.random.randint(0, 7)
        season = np.random.randint(0, 4)  # 0=summer, 1=monsoon, 2=post-monsoon, 3=winter

        # Price calculation logic
        base = BASE_PRICES[fish]
        price = base
        price *= (freshness / 100) ** 0.5             # Freshness effect
        price *= (1 + demand * 0.25)                   # Demand effect
        price *= (1.15 if stock <= 5 else 0.95 if stock >= 25 else 1.0)  # Stock scarcity
        price *= (1.08 if 17 <= hour <= 20 else 1.05 if 6 <= hour <= 10 else 0.97)  # Time
        price *= (1.1 if day_of_week in [5, 6] else 1.0)  # Weekend premium
        price *= (1.15 if season == 3 else 0.92 if season == 1 else 1.0)  # Seasonal
        price += np.random.normal(0, base * 0.05)     # Random noise

        records.append({
            "fish_type": fish,
            "freshness": freshness,
            "stock_remaining": stock,
            "demand_score": round(demand, 2),
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "season": season,
            "price": max(100, round(price))
        })

    return pd.DataFrame(records)


def train_model(df: pd.DataFrame = None):
    """Train Random Forest price prediction model"""
    if df is None:
        df = generate_training_data(3000)

    # Save training data
    df.to_csv("training_data.csv", index=False)
    print(f"✅ Training data: {len(df)} records")

    # Encode fish type
    le = LabelEncoder()
    df["fish_encoded"] = le.fit_transform(df["fish_type"])

    features = ["fish_encoded", "freshness", "stock_remaining", "demand_score",
                "hour_of_day", "day_of_week", "season"]
    X = df[features]
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=200, max_depth=12, min_samples_leaf=5,
        random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"📊 Model Performance:")
    print(f"   MAE: ₹{mae:.2f}")
    print(f"   R² Score: {r2:.4f}")
    print(f"   Accuracy: {(1 - mae/y_test.mean())*100:.1f}%")

    # Feature importance
    importance = dict(zip(features, model.feature_importances_))
    print(f"\n🔍 Feature Importance:")
    for feat, imp in sorted(importance.items(), key=lambda x: x[1], reverse=True):
        print(f"   {feat}: {imp:.3f}")

    # Save model and encoder
    with open("price_model.pkl", "wb") as f:
        pickle.dump({"model": model, "encoder": le}, f)
    print(f"\n💾 Model saved to price_model.pkl")

    return model, le


def predict(fish_type: str, freshness: int, stock_remaining: int,
            demand_score: float, hour_of_day: int,
            day_of_week: int = None, season: int = None) -> int:
    """
    Predict optimal price for a fish listing.

    Args:
        fish_type: Name of fish (must be in BASE_PRICES)
        freshness: 0-100 freshness score
        stock_remaining: kg remaining
        demand_score: 0.0-1.0 demand level
        hour_of_day: 0-23
        day_of_week: 0=Mon, 6=Sun (optional)
        season: 0=summer, 1=monsoon, 2=post-monsoon, 3=winter (optional)

    Returns:
        Predicted price per kg in INR
    """
    from datetime import datetime
    if day_of_week is None:
        day_of_week = datetime.now().weekday()
    if season is None:
        month = datetime.now().month
        season = 0 if month in [3,4,5] else 1 if month in [6,7,8] else 2 if month in [9,10,11] else 3

    model_path = os.path.join(os.path.dirname(__file__), "price_model.pkl")

    if os.path.exists(model_path):
        with open(model_path, "rb") as f:
            saved = pickle.load(f)
        model, le = saved["model"], saved["encoder"]
        try:
            fish_enc = le.transform([fish_type])[0]
        except ValueError:
            fish_enc = 0  # Unknown fish type
        X = np.array([[fish_enc, freshness, stock_remaining, demand_score,
                        hour_of_day, day_of_week, season]])
        return int(model.predict(X)[0])
    else:
        # Fallback rule-based calculation
        base = BASE_PRICES.get(fish_type, 500)
        price = base
        price *= (freshness / 100) ** 0.5
        price *= (1 + demand_score * 0.25)
        price *= 1.15 if stock_remaining <= 5 else 0.95 if stock_remaining >= 25 else 1.0
        price *= 1.08 if 17 <= hour_of_day <= 20 else 1.05 if 6 <= hour_of_day <= 10 else 1.0
        return int(price)


if __name__ == "__main__":
    print("🐟 AquaFresh – AI Price Prediction Model")
    print("=" * 50)

    # Generate data and train
    df = generate_training_data(3000)
    model, encoder = train_model(df)

    # Test predictions
    print("\n📝 Sample Predictions:")
    test_cases = [
        ("Salmon", 95, 5, 0.9, 7),     # Fresh, scarce, high demand, morning
        ("Salmon", 70, 30, 0.3, 14),   # Less fresh, abundant, low demand, afternoon
        ("Prawns", 99, 3, 0.95, 18),   # Very fresh, very scarce, peak demand, evening
        ("Sardine", 80, 40, 0.4, 10),  # Average conditions
        ("Lobster", 98, 2, 1.0, 19),   # Premium fish, evening peak
    ]

    for fish, fresh, stock, demand, hour in test_cases:
        price = predict(fish, fresh, stock, demand, hour)
        print(f"  {fish:15} | Fresh:{fresh}% | Stock:{stock:2}kg | Demand:{demand:.1f} | Hour:{hour:2}h → ₹{price}/kg")
