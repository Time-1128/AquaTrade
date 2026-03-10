import { useState } from "react";
import { useApp } from "../context/AppContext";
import Toast from "./components//Toast";

// AI Price Prediction simulation
function predictPrice(fish) {
  let base = fish.price;
  const freshnessMultiplier = fish.freshness >= 90 ? 1.0 : fish.freshness >= 75 ? 0.92 : 0.80;
  const demandRandom = 0.95 + Math.random() * 0.1;
  const stockPressure = fish.stock <= 5 ? 1.1 : fish.stock >= 20 ? 0.95 : 1.0;
  const hour = new Date().getHours();
  const timeFactor = (hour >= 6 && hour <= 10) ? 1.05 : (hour >= 17 && hour <= 20) ? 1.08 : 1.0;
  return Math.round(base * freshnessMultiplier * demandRandom * stockPressure * timeFactor);
}

export default function ProductDetailPage() {
  const { state, dispatch } = useApp();
  const fish = state.selectedProduct;
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");
  const [aiPrice] = useState(() => predictPrice(fish));
  const [activeTab, setActiveTab] = useState("details");
  const [rating, setRating] = useState(0);
  const [showRateModal, setShowRateModal] = useState(false);

  if (!fish) { dispatch({ type: "SET_PAGE", payload: "home" }); return null; }

  const freshnessColor = fish.freshness >= 90 ? "#2ECC71" : fish.freshness >= 75 ? "#F6C90E" : "#E74C3C";
  const freshnessLabel = fish.freshness >= 90 ? "Very Fresh" : fish.freshness >= 75 ? "Fresh" : "Moderate";

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const addToCart = () => {
    for (let i = 0; i < qty; i++) dispatch({ type: "ADD_TO_CART", payload: fish });
    showToast(`${qty}x ${fish.name} added to cart! 🛒`);
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps?q=${fish.location.lat},${fish.location.lng}`;
    window.open(url, "_blank");
  };

  const orderCount = state.orders.length;
  const discountPercent = orderCount < 3 ? 20 : fish.discount;
  const finalPrice = Math.round(aiPrice * (1 - discountPercent / 100));

  return (
    <div className="app-container" style={{ background: "white" }}>
      {/* Back button */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "16px 20px", display: "flex", justifyContent: "space-between",
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,180,216,0.1)"
      }}>
        <button onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })} style={{
          background: "#F0F9FF", border: "none", borderRadius: "12px",
          padding: "8px 16px", color: "#0A3D62", cursor: "pointer",
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px"
        }}>← Back</button>
        <button onClick={() => dispatch({ type: "SET_PAGE", payload: "cart" })} style={{
          background: "#0A3D62", border: "none", borderRadius: "12px",
          padding: "8px 16px", color: "white", cursor: "pointer",
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px"
        }}>🛒 Cart ({state.cart.reduce((s, i) => s + i.qty, 0)})</button>
      </div>

      <div style={{ overflowY: "auto", paddingBottom: "120px" }}>
        {/* Image hero */}
        <div style={{
          background: `linear-gradient(160deg, ${fish.color}30, ${fish.color}10)`,
          padding: "40px 20px", textAlign: "center", position: "relative"
        }}>
          {fish.tags?.map(tag => (
            <span key={tag} style={{
              position: "absolute", top: "16px",
              left: tag === fish.tags[0] ? "16px" : "auto",
              right: tag !== fish.tags[0] ? "16px" : "auto",
              background: "linear-gradient(135deg, #00B4D8, #0A3D62)",
              color: "white", padding: "4px 12px", borderRadius: "20px",
              fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 700
            }}>{tag}</span>
          ))}
          <div style={{ fontSize: "100px", lineHeight: 1, marginBottom: "12px", filter: `drop-shadow(0 8px 16px ${fish.color}60)` }}>
            {fish.image}
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 800, color: "#0A3D62" }}>
            {fish.name}
          </h1>
          <p style={{ color: "#718096", fontSize: "13px", marginTop: "4px" }}>{fish.type} • {fish.category}</p>
        </div>

        {/* AI Price section */}
        <div style={{
          margin: "16px 16px 0",
          background: "linear-gradient(135deg, #0A3D62, #00B4D8)",
          borderRadius: "20px", padding: "16px 20px", color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "11px", opacity: 0.7, fontFamily: "'Syne', sans-serif", marginBottom: "2px" }}>🤖 AI Dynamic Price</p>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: 800 }}>
                ₹{finalPrice}<span style={{ fontSize: "14px", opacity: 0.7 }}>/kg</span>
              </div>
              {orderCount < 3 && (
                <p style={{ fontSize: "11px", color: "#90E0EF" }}>🎁 First order 20% applied!</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", opacity: 0.7 }}>Original</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", textDecoration: "line-through", opacity: 0.5 }}>₹{aiPrice}</p>
              <span style={{
                background: "#FF6B6B", padding: "3px 10px", borderRadius: "10px",
                fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 700
              }}>{discountPercent}% OFF</span>
            </div>
          </div>
        </div>

        {/* Rating & details row */}
        <div style={{ display: "flex", gap: "10px", padding: "16px 16px 0" }}>
          <div style={{ flex: 1, background: "#F0F9FF", borderRadius: "14px", padding: "12px 14px" }}>
            <p style={{ fontSize: "11px", color: "#718096", marginBottom: "4px" }}>Rating</p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "#F6C90E", fontSize: "16px" }}>★</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "#0A3D62" }}>{fish.rating}</span>
            </div>
            <p style={{ fontSize: "10px", color: "#A0AEC0" }}>{fish.reviews} reviews</p>
          </div>
          <div style={{ flex: 1, background: "#F0FFF4", borderRadius: "14px", padding: "12px 14px" }}>
            <p style={{ fontSize: "11px", color: "#718096", marginBottom: "4px" }}>Freshness</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: freshnessColor }}>{fish.freshness}%</p>
            <p style={{ fontSize: "10px", color: freshnessColor }}>{freshnessLabel}</p>
          </div>
          <div style={{ flex: 1, background: "#FFF8F0", borderRadius: "14px", padding: "12px 14px" }}>
            <p style={{ fontSize: "11px", color: "#718096", marginBottom: "4px" }}>Distance</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "#0A3D62" }}>{fish.sellerDist}km</p>
            <p style={{ fontSize: "10px", color: "#A0AEC0" }}>ETA: {fish.eta}</p>
          </div>
        </div>

        {/* Freshness bar */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#0A3D62" }}>Freshness Level</span>
            <span style={{ fontSize: "13px", color: freshnessColor, fontWeight: 700 }}>{fish.freshness}%</span>
          </div>
          <div className="freshness-bar">
            <div className="freshness-fill" style={{ width: `${fish.freshness}%`, background: freshnessColor }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", padding: "16px 16px 0", borderBottom: "2px solid #F0F4F8" }}>
          {["details", "seller", "reviews"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: "10px", border: "none", background: "none",
              borderBottom: `3px solid ${activeTab === t ? "#00B4D8" : "transparent"}`,
              color: activeTab === t ? "#00B4D8" : "#718096",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px",
              cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s"
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding: "16px 16px" }}>
          {activeTab === "details" && (
            <>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px", color: "#0A3D62", marginBottom: "10px" }}>About this fish</h3>
              <p style={{ color: "#4A5568", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>{fish.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Stock", value: `${fish.stock} kg left`, icon: "📦" },
                  { label: "Category", value: fish.category, icon: "🐠" },
                  { label: "Water type", value: fish.type, icon: "🌊" },
                  { label: "Seller", value: fish.sellerName, icon: "🎣" }
                ].map(item => (
                  <div key={item.label} style={{ background: "#F7FAFC", borderRadius: "12px", padding: "12px" }}>
                    <p style={{ fontSize: "11px", color: "#A0AEC0", marginBottom: "3px" }}>{item.icon} {item.label}</p>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", color: "#0A3D62" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "seller" && (
            <>
              <div style={{ background: "#F0F9FF", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, #00B4D8, #0A3D62)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🎣</div>
                  <div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 800, color: "#0A3D62" }}>{fish.sellerName}</h3>
                    <p style={{ fontSize: "12px", color: "#718096" }}>Verified Fisherman</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ background: "#E8FFF3", color: "#1A7A4C", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>✓ Verified</span>
                  <span style={{ background: "#E8F9FF", color: "#0A3D62", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>⭐ 4.8 Seller Rating</span>
                </div>
                <p style={{ fontSize: "13px", color: "#4A5568", marginBottom: "14px" }}>📍 {fish.location.address}</p>
                <button onClick={openMaps} style={{
                  width: "100%", padding: "12px", background: "white",
                  border: "2px solid #00B4D8", borderRadius: "12px",
                  color: "#00B4D8", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: "14px", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: "8px"
                }}>
                  🗺️ View on Google Maps
                </button>
              </div>
            </>
          )}

          {activeTab === "reviews" && (
            <div>
              <button onClick={() => setShowRateModal(true)} style={{
                width: "100%", padding: "14px", background: "#F0F9FF",
                border: "2px dashed #00B4D8", borderRadius: "14px",
                color: "#00B4D8", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: "14px", cursor: "pointer", marginBottom: "16px"
              }}>+ Rate this fish</button>
              {[
                { name: "Priya S.", rating: 5, text: "Absolutely fresh! Arrived within 20 minutes. Will order again." },
                { name: "Karthik M.", rating: 4, text: "Good quality fish, fair price. Packaging could be better." },
                { name: "Sunitha R.", rating: 5, text: "Best seafood I've ever ordered online. Super fresh!" }
              ].map((r, i) => (
                <div key={i} style={{ background: "#F7FAFC", borderRadius: "14px", padding: "14px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>{r.name}</span>
                    <span style={{ color: "#F6C90E" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#4A5568" }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "480px", background: "white",
        borderTop: "1px solid #EDF2F7", padding: "12px 20px 20px",
        display: "flex", gap: "12px", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0", border: "2px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: "white", border: "none", width: "40px", height: "44px", fontSize: "18px", cursor: "pointer", color: "#0A3D62" }}>−</button>
          <span style={{ width: "36px", textAlign: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62" }}>{qty}</span>
          <button onClick={() => setQty(q => q + 1)} style={{ background: "white", border: "none", width: "40px", height: "44px", fontSize: "18px", cursor: "pointer", color: "#0A3D62" }}>+</button>
        </div>
        <button onClick={addToCart} className="btn-primary" style={{ flex: 1, padding: "14px", fontSize: "15px" }}>
          Add {qty}kg – ₹{finalPrice * qty}
        </button>
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "28px 24px", width: "100%" }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: "#0A3D62", marginBottom: "20px", textAlign: "center" }}>Rate {fish.name}</h3>
            {["Freshness", "Taste", "Overall"].map(cat => (
              <div key={cat} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", color: "#718096", marginBottom: "8px" }}>{cat}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} style={{
                      background: "none", border: "none", fontSize: "28px", cursor: "pointer",
                      color: s <= rating ? "#F6C90E" : "#E2E8F0", transition: "all 0.2s"
                    }}>★</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button onClick={() => setShowRateModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { showToast("Thanks for rating! ⭐"); setShowRateModal(false); }} className="btn-primary" style={{ flex: 1 }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
