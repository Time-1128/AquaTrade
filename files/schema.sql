-- ============================================================
-- AquaFresh – Smart Fish Marketplace
-- PostgreSQL Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;  -- For geolocation queries

-- ─── USERS ─────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone       VARCHAR(10) UNIQUE NOT NULL,
    name        VARCHAR(100),
    role        VARCHAR(10) CHECK (role IN ('buyer', 'seller')) NOT NULL,
    email       VARCHAR(200),
    avatar_url  TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_addresses (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    label      VARCHAR(50),           -- "Home", "Work", etc.
    address    TEXT NOT NULL,
    lat        DECIMAL(10, 8),
    lng        DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── SELLERS / FISHERMEN ───────────────────────────────────
CREATE TABLE sellers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    shop_name    VARCHAR(200) NOT NULL,
    description  TEXT,
    market_name  VARCHAR(200),
    lat          DECIMAL(10, 8),
    lng          DECIMAL(11, 8),
    address      TEXT,
    rating       DECIMAL(3, 2) DEFAULT 0.0,
    total_sales  INTEGER DEFAULT 0,
    is_verified  BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ─── FISH LISTINGS ─────────────────────────────────────────
CREATE TABLE fish_listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID REFERENCES sellers(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    water_type      VARCHAR(20) CHECK (water_type IN ('Sea water', 'Fresh water', 'Lake', 'Pond')),
    category        VARCHAR(20) CHECK (category IN ('Fish', 'Prawns', 'Crab', 'Dried fish', 'Live fish')),
    price_per_kg    DECIMAL(10, 2) NOT NULL,
    ai_price        DECIMAL(10, 2),              -- AI suggested price
    original_price  DECIMAL(10, 2),
    discount_pct    INTEGER DEFAULT 0,
    stock_kg        DECIMAL(10, 2) NOT NULL,
    freshness_pct   INTEGER DEFAULT 100 CHECK (freshness_pct BETWEEN 0 AND 100),
    image_url       TEXT,
    is_available    BOOLEAN DEFAULT TRUE,
    is_live         BOOLEAN DEFAULT FALSE,       -- For "Live fish" category
    tags            TEXT[],                      -- ["Top Pick", "Best Deal"]
    catch_time      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fish_category ON fish_listings(category);
CREATE INDEX idx_fish_water_type ON fish_listings(water_type);
CREATE INDEX idx_fish_price ON fish_listings(price_per_kg);
CREATE INDEX idx_fish_available ON fish_listings(is_available);

-- ─── FISH RATINGS ──────────────────────────────────────────
CREATE TABLE fish_ratings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fish_id      UUID REFERENCES fish_listings(id),
    user_id      UUID REFERENCES users(id),
    order_id     UUID,
    freshness    INTEGER CHECK (freshness BETWEEN 1 AND 5),
    taste        INTEGER CHECK (taste BETWEEN 1 AND 5),
    overall      INTEGER CHECK (overall BETWEEN 1 AND 5),
    review       TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(fish_id, user_id, order_id)
);

-- ─── ORDERS ────────────────────────────────────────────────
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id        VARCHAR(20) UNIQUE NOT NULL,  -- TKN123456
    buyer_id        UUID REFERENCES users(id),
    subtotal        DECIMAL(10, 2) NOT NULL,
    booking_fee     DECIMAL(10, 2) DEFAULT 50,
    delivery_fee    DECIMAL(10, 2) DEFAULT 0,
    discount_amt    DECIMAL(10, 2) DEFAULT 0,
    total           DECIMAL(10, 2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'Confirmed'
                    CHECK (status IN ('Pending', 'Confirmed', 'Ready', 'Picked Up', 'Cancelled')),
    payment_method  VARCHAR(20),
    payment_status  VARCHAR(20) DEFAULT 'Paid',
    pickup_address  TEXT,
    time_slot       VARCHAR(50),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
    fish_id      UUID REFERENCES fish_listings(id),
    fish_name    VARCHAR(200),
    seller_id    UUID REFERENCES sellers(id),
    qty_kg       DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    total_price  DECIMAL(10, 2) NOT NULL
);

-- ─── OFFERS & LOYALTY ──────────────────────────────────────
CREATE TABLE offers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        VARCHAR(200),
    description  TEXT,
    discount_pct INTEGER,
    min_orders   INTEGER DEFAULT 0,   -- Min orders required
    max_orders   INTEGER,             -- NULL = unlimited
    valid_until  TIMESTAMP,
    is_active    BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_loyalty (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID REFERENCES users(id) UNIQUE,
    points         INTEGER DEFAULT 0,
    total_orders   INTEGER DEFAULT 0,
    total_spent    DECIMAL(10, 2) DEFAULT 0,
    level          VARCHAR(20) DEFAULT 'Bronze',  -- Bronze/Silver/Gold/Platinum
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- ─── SUPPLY MARKETPLACE (for sellers) ─────────────────────
CREATE TABLE supplies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    price       DECIMAL(10, 2) NOT NULL,
    category    VARCHAR(50),  -- "Ice", "Storage", "Equipment"
    in_stock    BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE supply_orders (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id  UUID REFERENCES sellers(id),
    supply_id  UUID REFERENCES supplies(id),
    qty        INTEGER NOT NULL,
    total      DECIMAL(10, 2),
    status     VARCHAR(20) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── AI PRICE LOG ──────────────────────────────────────────
CREATE TABLE ai_price_log (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fish_id        UUID REFERENCES fish_listings(id),
    fish_type      VARCHAR(200),
    freshness      INTEGER,
    stock_kg       DECIMAL,
    demand_score   DECIMAL,
    hour_of_day    INTEGER,
    predicted_price DECIMAL(10, 2),
    actual_price   DECIMAL(10, 2),
    logged_at      TIMESTAMP DEFAULT NOW()
);

-- ─── USEFUL VIEWS ──────────────────────────────────────────
CREATE VIEW fish_with_seller AS
SELECT
    f.*,
    s.shop_name AS seller_name,
    s.market_name,
    s.lat AS seller_lat,
    s.lng AS seller_lng,
    s.address AS seller_address,
    s.rating AS seller_rating,
    COALESCE(AVG(r.overall), 0) AS avg_rating,
    COUNT(r.id) AS review_count
FROM fish_listings f
LEFT JOIN sellers s ON f.seller_id = s.id
LEFT JOIN fish_ratings r ON f.id = r.fish_id
WHERE f.is_available = TRUE
GROUP BY f.id, s.id;

-- ─── FUNCTIONS ─────────────────────────────────────────────
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fish_updated BEFORE UPDATE ON fish_listings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Generate token ID
CREATE OR REPLACE FUNCTION generate_token_id()
RETURNS TEXT AS $$
BEGIN RETURN 'TKN' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'); END;
$$ LANGUAGE plpgsql;
