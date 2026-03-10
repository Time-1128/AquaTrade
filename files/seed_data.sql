-- ============================================================
-- AquaFresh – Seed Data
-- Run after schema.sql
-- ============================================================

-- Sample Users
INSERT INTO users (id, phone, name, role, is_verified) VALUES
('11111111-1111-1111-1111-111111111111', '9876543210', 'Arjun Kumar', 'buyer', TRUE),
('22222222-2222-2222-2222-222222222222', '9123456789', 'Priya Sharma', 'buyer', TRUE),
('33333333-3333-3333-3333-333333333333', '9988776655', 'Rajan Pillai', 'seller', TRUE),
('44444444-4444-4444-4444-444444444444', '9944332211', 'Kumar Fisheries', 'seller', TRUE),
('55555555-5555-5555-5555-555555555555', '9865432109', 'Harbor Traders', 'seller', TRUE);

-- Sample Sellers
INSERT INTO sellers (id, user_id, shop_name, market_name, lat, lng, address, rating, is_verified) VALUES
('aaa11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', "Rajan's Fresh Catch", 'Marina Beach Fish Market', 13.0827, 80.2707, 'Marina Beach Rd, Chennai - 600001', 4.8, TRUE),
('bbb22222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Deep Sea Traders', 'Kasimedu Fishing Harbour', 13.0569, 80.2425, 'Kasimedu, Chennai - 600081', 4.6, TRUE),
('ccc33333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Harbor Fresh', 'Ennore Harbour', 13.0700, 80.2900, 'Ennore, Chennai - 600057', 4.7, TRUE);

-- Sample Fish Listings
INSERT INTO fish_listings (name, description, water_type, category, price_per_kg, original_price, discount_pct, stock_kg, freshness_pct, seller_id, tags) VALUES
('Atlantic Salmon', 'Premium Atlantic Salmon, freshly caught this morning. Rich in omega-3 fatty acids.', 'Sea water', 'Fish', 850, 1000, 15, 12, 95, 'aaa11111-1111-1111-1111-111111111111', ARRAY['Top Pick', 'Best Deal']),
('Yellowfin Tuna', 'Sashimi-grade Yellowfin Tuna, deep-sea caught. Lean, firm flesh.', 'Sea water', 'Fish', 1200, 1400, 14, 8, 88, 'bbb22222-2222-2222-2222-222222222222', ARRAY['Premium']),
('Indian Mackerel', 'Fresh Indian Mackerel packed with flavor. Perfect for curry or fry.', 'Sea water', 'Fish', 320, 380, 16, 25, 92, 'ccc33333-3333-3333-3333-333333333333', ARRAY['Best Deal', 'Nearby']),
('Tiger Prawns', 'Jumbo Tiger Prawns, live and fresh. Succulent, meaty with sweet ocean flavor.', 'Sea water', 'Prawns', 680, 780, 13, 15, 97, 'aaa11111-1111-1111-1111-111111111111', ARRAY['Top Pick', 'Highly Rated']),
('Blue Swimming Crab', 'Live Blue Swimming Crabs, caught fresh from the bay. Delicate, sweet meat.', 'Sea water', 'Crab', 920, 1050, 12, 6, 89, 'ccc33333-3333-3333-3333-333333333333', ARRAY['Live', 'Premium']),
('Pomfret (Silver)', 'Premium Silver Pomfret, the king of fish. Delicate white flesh with minimal bones.', 'Sea water', 'Fish', 760, 900, 16, 10, 94, 'bbb22222-2222-2222-2222-222222222222', ARRAY['Top Pick']),
('Rohu (Fresh Water)', 'Farm-raised Rohu from pristine freshwater ponds.', 'Fresh water', 'Fish', 280, 320, 13, 30, 91, 'aaa11111-1111-1111-1111-111111111111', ARRAY['Fresh Water', 'Best Deal']),
('Dried Sardine', 'Sun-dried Sardines with traditional salt cure.', 'Sea water', 'Dried fish', 180, 200, 10, 50, 75, 'ccc33333-3333-3333-3333-333333333333', ARRAY['Dried']),
('Live Lobster', 'Live Atlantic Lobster, still active in water. The ultimate luxury seafood.', 'Sea water', 'Live fish', 2400, 2800, 14, 4, 99, 'ccc33333-3333-3333-3333-333333333333', ARRAY['Live', 'Premium', 'Top Pick']),
('Hilsa (Ilish)', 'The prized Hilsa fish. Extraordinarily rich, oily flesh. Seasonal delicacy!', 'Fresh water', 'Fish', 1800, 2100, 14, 5, 96, 'bbb22222-2222-2222-2222-222222222222', ARRAY['Seasonal', 'Premium', 'Highly Rated']);

-- Offers
INSERT INTO offers (title, description, discount_pct, min_orders, max_orders, valid_until) VALUES
('First Order Offer', 'Get 20% off on your first order!', 20, 0, 0, NOW() + INTERVAL '1 year'),
('Second Order Deal', 'Your second order gets 15% off!', 15, 1, 1, NOW() + INTERVAL '1 year'),
('Third Order Bonus', '10% off on your third order!', 10, 2, 2, NOW() + INTERVAL '1 year'),
('Monthly Loyalty Reward', '5% cashback for ordering 5+ times a month', 5, 5, NULL, NOW() + INTERVAL '1 year');

-- Supplies for sellers
INSERT INTO supplies (name, description, price, category) VALUES
('Ice Blocks (20kg)', 'Premium cold storage ice for fish preservation', 80, 'Ice'),
('Fish Storage Box', 'Insulated 50L container for fresh storage', 350, 'Storage'),
('Fishing Net (5m)', 'Commercial grade nylon mesh netting', 1200, 'Equipment'),
('Sea Salt (5kg)', 'Coarse sea salt for fish preservation', 45, 'Preservation'),
('Fish Crates (Set of 5)', 'Stackable plastic fish crates', 650, 'Storage'),
('Weighing Scale', 'Digital 50kg capacity', 1500, 'Equipment');
