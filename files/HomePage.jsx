import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import FishCard from "./components//FishCard";
import FilterPanel from "./components//FilterPanel";
import BottomNav from "./components//BottomNav";
import Toast from "./components//Toast";

export default function HomePage() {
  const { state, dispatch } = useApp();
  const { fish, searchQuery, filters, activeTab, cart, user } = state;
  const [showFilters, setShowFilters] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const tabs = ["All", "Sea water", "Fresh water", "Lake", "Pond", "Top Picks", "Best Deals"];
  const categories = ["All", "Fish", "Prawns", "Crab", "Dried fish", "Live fish"];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      showToast("Voice search not supported");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-IN";
    r.onstart = () => setListening(true);
    r.onresult = (e) => {
      dispatch({ type: "SET_SEARCH", payload: e.results[0][0].transcript });
      setListening(false);
    };
    r.onerror = () => { setListening(false); showToast("Voice not detected, try again"); };
    r.onend = () => setListening(false);
    r.start();
  };

  // Fuzzy search
  const fuzzyMatch = (str, query) => {
    str = str.toLowerCase(); query = query.toLowerCase();
    if (str.includes(query)) return true;
    let qi = 0;
    for (let i = 0; i < str.length && qi < query.length; i++) {
      if (str[i] === query[qi]) qi++;
    }
    return qi === query.length;
  };

  const allFishNames = [...new Set(fish.map(f => f.name))];
  useEffect(() => {
    if (searchQuery.length > 1) {
      setSuggestions(allFishNames.filter(n => fuzzyMatch(n, searchQuery)).slice(0, 5));
    } else setSuggestions([]);
  }, [searchQuery]);

  const filtered = fish.filter(f => {
    if (searchQuery && !fuzzyMatch(f.name, searchQuery) && !fuzzyMatch(f.category, searchQuery)) return false;
    if (activeTab === "Top Picks" && !f.tags?.includes("Top Pick")) return false;
    if (activeTab === "Best Deals" && !f.tags?.includes("Best Deal")) return false;
    if (!["All", "Top Picks", "Best Deals"].includes(activeTab) && f.type !== activeTab) return false;
    if (filters.category !== "All" && f.category !== filters.category) return false;
    if (f.price < filters.priceRange[0] || f.price > filters.priceRange[1]) return false;
    if (f.rating < filters.minRating) return false;
    if (f.sellerDist > filters.maxDistance) return false;
    if (filters.discount && !f.discount) return false;
    return true;
  });

  const topPicks = fish.filter(f => f.tags?.includes("Top Pick")).slice(0, 4);
  const bestDeals = fish.filter(f => f.discount >= 14).slice(0, 4);
  const highlyRated = fish.filter(f => f.rating >= 4.7).slice(0, 4);

  const addToCart = (item) => {
    dispatch({ type: "ADD_TO_CART", payload: item });
    showToast(`${item.name} added to cart! 🛒`);
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Discount for first 3 orders
  const orderCount = state.orders.length;
  const hasDiscount = orderCount < 3;

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A3D62, #1A5276)", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Location bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "white" }}>
              <span style={{ fontSize: "16px" }}>📍</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 700 }}>Marina Beach Area</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>▼</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginLeft: "22px" }}>Chennai, Tamil Nadu</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {hasDiscount && (
              <span style={{
                background: "linear-gradient(135deg, #FF6B6B, #E74C3C)",
                color: "white", padding: "4px 10px", borderRadius: "20px",
                fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 700
              }}>🎁 {3 - orderCount} free deals left!</span>
            )}
            <div style={{ position: "relative" }}>
              <button onClick={() => dispatch({ type: "SET_PAGE", payload: "cart" })} style={{
                background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "12px",
                padding: "8px 12px", color: "white", fontSize: "18px", cursor: "pointer"
              }}>🛒</button>
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: "-6px", right: "-6px",
                  background: "#FF6B6B", color: "white", borderRadius: "50%",
                  width: "20px", height: "20px", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 800
                }}>{cartCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <div style={{
            background: "white", borderRadius: "14px", display: "flex",
            alignItems: "center", padding: "2px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }}>
            <span style={{ fontSize: "18px", marginRight: "8px" }}>🔍</span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
              placeholder="Search fish, prawns, crab..."
              style={{
                flex: 1, border: "none", outline: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: "14px",
                color: "#0A3D62", background: "transparent", padding: "12px 0"
              }}
            />
            <button onClick={() => dispatch({ type: "SET_FILTERS", payload: {} })}
              style={{ background: "none", border: "none", cursor: "pointer", marginRight: "4px", fontSize: "16px" }}
              onClick={() => setShowFilters(true)}
            >⚙️</button>
            <button onClick={startVoice} style={{
              background: listening ? "#FF6B6B" : "#00B4D8",
              border: "none", borderRadius: "10px", padding: "8px 12px",
              color: "white", cursor: "pointer", fontSize: "14px",
              animation: listening ? "pulse 1s infinite" : "none"
            }}>
              {listening ? "🔴" : "🎤"}
            </button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "white", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              zIndex: 200, overflow: "hidden", marginTop: "4px"
            }}>
              {suggestions.map(s => (
                <div key={s} onClick={() => { dispatch({ type: "SET_SEARCH", payload: s }); setSuggestions([]); }}
                  style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                    borderBottom: "1px solid #F0F4F8", transition: "background 0.2s" }}
                  onMouseEnter={e => e.target.style.background = "#F0F9FF"}
                  onMouseLeave={e => e.target.style.background = "white"}
                >
                  <span>🐟</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#0A3D62" }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="tag-scroll" style={{ paddingBottom: "12px" }}>
          {categories.map(c => (
            <button key={c} className={`tag-pill ${filters.category === c ? "active" : ""}`}
              onClick={() => dispatch({ type: "SET_FILTERS", payload: { category: c } })}
              style={{ background: filters.category === c ? "white" : "rgba(255,255,255,0.12)",
                color: filters.category === c ? "#0A3D62" : "rgba(255,255,255,0.8)",
                border: filters.category === c ? "2px solid white" : "2px solid rgba(255,255,255,0.2)" }}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tag-scroll" style={{ padding: "14px 20px 10px", background: "white", borderBottom: "1px solid #EDF2F7" }}>
        {tabs.map(t => (
          <button key={t} className={`tag-pill ${activeTab === t ? "active" : ""}`}
            onClick={() => dispatch({ type: "SET_TAB", payload: t })}>
            {t === "Top Picks" ? "⭐ " : t === "Best Deals" ? "🔥 " : ""}{t}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="scrollable-content" style={{ padding: "16px 16px" }}>
        {/* First order banner */}
        {hasDiscount && orderCount === 0 && (
          <div style={{
            background: "linear-gradient(135deg, #FF6B6B, #E74C3C)",
            borderRadius: "16px", padding: "16px 20px", marginBottom: "20px",
            color: "white", display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px" }}>🎁 First Order Offer!</p>
              <p style={{ fontSize: "12px", opacity: 0.9 }}>Get 20% off your first 3 orders</p>
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "28px" }}>20%<br /><span style={{ fontSize: "12px" }}>OFF</span></div>
          </div>
        )}

        {/* Top Picks section */}
        {activeTab === "All" && (
          <>
            <div className="section-title">⭐ Top Picks</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {topPicks.map(f => <FishCard key={f.id} fish={f} onAdd={() => addToCart(f)} />)}
            </div>

            <div className="section-title">🔥 Best Deals</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {bestDeals.map(f => <FishCard key={f.id} fish={f} onAdd={() => addToCart(f)} />)}
            </div>

            <div className="section-title">💎 Highly Rated</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {highlyRated.map(f => <FishCard key={f.id} fish={f} onAdd={() => addToCart(f)} />)}
            </div>

            <div className="section-title">🐟 All Seafood</div>
          </>
        )}

        {activeTab === "Top Picks" && <div className="section-title">⭐ Top Picks for You</div>}
        {activeTab === "Best Deals" && <div className="section-title">🔥 Best Deals Today</div>}

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#A0AEC0" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🌊</div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#4A5568" }}>No fish found</p>
            <p style={{ fontSize: "14px" }}>Try different search terms or filters</p>
            <button className="btn-secondary" style={{ width: "auto", marginTop: "16px", padding: "10px 24px" }}
              onClick={() => { dispatch({ type: "SET_SEARCH", payload: "" }); dispatch({ type: "SET_TAB", payload: "All" }); dispatch({ type: "SET_FILTERS", payload: { category: "All" } }); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {filtered.map(f => <FishCard key={f.id} fish={f} onAdd={() => addToCart(f)} />)}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && <FilterPanel onClose={() => setShowFilters(false)} />}

      <BottomNav />
      {toast && <Toast message={toast} />}
    </div>
  );
}
