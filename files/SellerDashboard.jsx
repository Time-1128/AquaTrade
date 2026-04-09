import { useState } from "react";
import { useApp } from "../context/AppContext";

const SUPPLIES = [
  { id: "ice", name: "Ice Blocks (20kg)", price: 80, icon: "🧊", desc: "Premium cold storage ice" },
  { id: "box", name: "Fish Storage Box", price: 350, icon: "📦", desc: "Insulated 50L container" },
  { id: "net", name: "Fishing Net (5m)", price: 1200, icon: "🕸️", desc: "Nylon mesh netting" },
  { id: "salt", name: "Sea Salt (5kg)", price: 45, icon: "🧂", desc: "For preservation" },
];

export default function SellerDashboard() {
  const { state, dispatch } = useApp();
  const { sellerProducts, orders } = state;
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({ name: "", fishTypes: [], type: "Sea water", category: "Fish", price: "", stock: "", freshness: 90, description: "" });
  const [toast, setToast] = useState("");
  const [supplyCart, setSupplyCart] = useState([]);
  const fishTypeOptions = ["Freshwater", "Saltwater", "Shellfish", "Exotic"];

  const handleFishTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      fishTypes: prev.fishTypes.includes(type)
        ? prev.fishTypes.filter(t => t !== type)
        : [...prev.fishTypes, type]
    }));
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const addFish = () => {
    if (!form.name || !form.price || !form.stock) { showToast("Fill all required fields"); return; }
    const newFish = {
      id: Date.now(), ...form, price: +form.price, stock: +form.stock, freshness: +form.freshness,
      originalPrice: Math.round(+form.price * 1.15),
      rating: 4.5, reviews: 0, sellerId: 99, sellerName: state.user?.name || "Your Store",
      sellerDist: 0.5, eta: "5 min", discount: 0, image: "🐟", color: "#00B4D8",
      tags: ["New"], location: { lat: 13.0827, lng: 80.2707, address: "Your Market Location" }
    };
    dispatch({ type: "ADD_SELLER_PRODUCT", payload: newFish });
    setForm({ name: "", fishTypes: [], type: "Sea water", category: "Fish", price: "", stock: "", freshness: 90, description: "" });
    showToast("Fish listed successfully! 🎉");
  };

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;

  const fishTypeBadgeColors = {
    Freshwater: { bg: "#E0F2FE", color: "#0369A1" },
    Saltwater:  { bg: "#E0FDF4", color: "#065F46" },
    Shellfish:  { bg: "#FEF3C7", color: "#92400E" },
    Exotic:     { bg: "#FAE8FF", color: "#7E22CE" },
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1A5276, #2ECC71)", padding: "20px 20px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Welcome back,</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "white" }}>
              {state.user?.name || "Fisherman"} 🎣
            </h1>
          </div>
          <button onClick={() => { dispatch({ type: "SET_USER", payload: null }); dispatch({ type: "SET_PAGE", payload: "login" }); }}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "10px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
            Logout
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { label: "Revenue", value: `₹${totalRevenue}`, icon: "💰" },
            { label: "Orders", value: totalOrders, icon: "📦" },
            { label: "Listed", value: sellerProducts.length, icon: "🐟" }
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: "14px", padding: "12px", textAlign: "center", backdropFilter: "blur(10px)" }}>
              <p style={{ fontSize: "18px" }}>{s.icon}</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "white" }}>{s.value}</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", background: "white", borderBottom: "2px solid #F0F4F8" }}>
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "add", label: "➕ Add Fish" },
          { id: "supplies", label: "🧊 Supplies" },
          { id: "listings", label: "📋 Listings" }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "12px 4px", border: "none", background: "none",
            borderBottom: `3px solid ${activeTab === t.id ? "#2ECC71" : "transparent"}`,
            color: activeTab === t.id ? "#1A5276" : "#718096",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "11px",
            cursor: "pointer"
          }}>{t.label}</button>
        ))}
      </div>

      <div className="scrollable-content" style={{ padding: "16px" }}>
        {activeTab === "dashboard" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #E8FFF3, #C8F5E0)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A5C35", marginBottom: "12px" }}>📈 Today's Summary</h3>
              {[
                { label: "Active listings", value: sellerProducts.length + " items" },
                { label: "Pending orders", value: "0" },
                { label: "Today's earnings", value: "₹0" },
                { label: "Total buyers reached", value: "127" }
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#4A5568" }}>{row.label}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#1A5276" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFAE0", border: "1px solid #F6C90E", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#B8860B", marginBottom: "4px" }}>🤖 AI Price Tip</p>
              <p style={{ fontSize: "13px", color: "#8B6914" }}>Demand for Pomfret is high this morning! Consider raising price by 10-15%</p>
            </div>

            <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px", color: "#0A3D62", marginBottom: "12px" }}>💡 Quick Actions</h3>
              {[
                { label: "Add New Fish Listing", icon: "➕", action: () => setActiveTab("add") },
                { label: "Order Ice Blocks", icon: "🧊", action: () => setActiveTab("supplies") },
                { label: "View My Listings", icon: "📋", action: () => setActiveTab("listings") },
                { label: "Buyer Marketplace", icon: "🏪", action: () => { dispatch({ type: "SET_USER", payload: { ...state.user, role: "buyer" } }); dispatch({ type: "SET_PAGE", payload: "home" }); } }
              ].map(item => (
                <div key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #F0F4F8", cursor: "pointer" }}>
                  <span style={{ fontSize: "20px" }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "14px", color: "#0A3D62" }}>{item.label}</span>
                  <span style={{ marginLeft: "auto", color: "#A0AEC0" }}>›</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "add" && (
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62", marginBottom: "18px" }}>🐟 List Your Catch</h3>

            {/* Fish Name */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Fish Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(fm => ({ ...fm, name: e.target.value }))} placeholder="e.g., Fresh Pomfret" className="input-field" />
            </div>

            {/* Fish Type Checkboxes — placed right after Fish Name */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "8px" }}>
                🐠 Type of Fish
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {fishTypeOptions.map(type => {
                  const isChecked = form.fishTypes.includes(type);
                  const colors = fishTypeBadgeColors[type];
                  return (
                    <label
                      key={type}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        border: `2px solid ${isChecked ? colors.color : "#E2E8F0"}`,
                        background: isChecked ? colors.bg : "#FAFAFA",
                        transition: "all 0.2s"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFishTypeChange(type)}
                        style={{ accentColor: colors.color, width: "15px", height: "15px" }}
                      />
                      <span style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "13px",
                        color: isChecked ? colors.color : "#718096"
                      }}>
                        {type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Price per kg (₹) *</label>
              <input type="number" value={form.price} onChange={e => setForm(fm => ({ ...fm, price: e.target.value }))} placeholder="e.g., 450" className="input-field" />
            </div>

            {/* Stock */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Available stock (kg) *</label>
              <input type="number" value={form.stock} onChange={e => setForm(fm => ({ ...fm, stock: e.target.value }))} placeholder="e.g., 20" className="input-field" />
            </div>

            {/* Description */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(fm => ({ ...fm, description: e.target.value }))} rows={3} placeholder="Fresh catch description..." className="input-field" style={{ resize: "none" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Water Type</label>
                <select value={form.type} onChange={e => setForm(fm => ({ ...fm, type: e.target.value }))} className="input-field">
                  {["Sea water", "Fresh water", "Lake", "Pond"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>Category</label>
                <select value={form.category} onChange={e => setForm(fm => ({ ...fm, category: e.target.value }))} className="input-field">
                  {["Fish", "Prawns", "Crab", "Dried fish", "Live fish"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "13px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568", display: "block", marginBottom: "6px" }}>
                Freshness Level: {form.freshness}%
              </label>
              <input type="range" min={50} max={100} value={form.freshness} onChange={e => setForm(fm => ({ ...fm, freshness: +e.target.value }))} style={{ width: "100%", accentColor: "#2ECC71" }} />
            </div>

            <button onClick={addFish} style={{
              width: "100%", padding: "15px", background: "linear-gradient(135deg, #2ECC71, #27AE60)",
              border: "none", borderRadius: "50px", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px",
              cursor: "pointer", boxShadow: "0 6px 20px rgba(46,204,113,0.4)"
            }}>
              List Fish for Sale 🐟
            </button>
          </div>
        )}

        {activeTab === "supplies" && (
          <>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: "#0A3D62", marginBottom: "14px" }}>🏪 Fisherman's Supply Store</p>
            {SUPPLIES.map(item => (
              <div key={item.id} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", display: "flex", gap: "14px", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ width: "52px", height: "52px", background: "#E8F9FF", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", marginBottom: "2px" }}>{item.name}</p>
                  <p style={{ fontSize: "12px", color: "#718096", marginBottom: "4px" }}>{item.desc}</p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#0A3D62" }}>₹{item.price}</p>
                </div>
                <button onClick={() => { setSupplyCart(c => [...c, item]); showToast(`${item.name} added! 🛒`); }}
                  style={{ background: "linear-gradient(135deg, #00B4D8, #0A3D62)", border: "none", borderRadius: "10px", padding: "8px 14px", color: "white", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px" }}>
                  Add
                </button>
              </div>
            ))}
            {supplyCart.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, #0A3D62, #00B4D8)", borderRadius: "16px", padding: "16px 20px", color: "white", marginTop: "8px" }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "4px" }}>🛒 Supply Cart ({supplyCart.length} items)</p>
                <p style={{ fontSize: "12px", opacity: 0.8 }}>Total: ₹{supplyCart.reduce((s, i) => s + i.price, 0)}</p>
                <button onClick={() => { showToast("Supply order placed! 🎉"); setSupplyCart([]); }}
                  style={{ marginTop: "12px", background: "white", color: "#0A3D62", border: "none", borderRadius: "20px", padding: "8px 20px", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
                  Place Supply Order
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "listings" && (
          sellerProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#A0AEC0" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>🐟</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 700, color: "#4A5568", marginBottom: "12px" }}>No listings yet</p>
              <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={() => setActiveTab("add")}>Add Your First Fish</button>
            </div>
          ) : (
            sellerProducts.map(f => (
              <div key={f.id} style={{ background: "white", borderRadius: "16px", padding: "14px 16px", marginBottom: "10px", display: "flex", gap: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ width: "52px", height: "52px", background: "#E8F9FF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>{f.image}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>{f.name}</p>
                  <p style={{ fontSize: "12px", color: "#718096" }}>₹{f.price}/kg • {f.stock}kg left</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    <span style={{ background: "#E8FFF3", color: "#1A7A4C", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                      {f.freshness}% fresh
                    </span>
                    <span style={{ background: "#E8F9FF", color: "#0A3D62", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                      {f.category}
                    </span>
                    {/* Fish Type Badges */}
                    {Array.isArray(f.fishTypes) && f.fishTypes.map(type => {
                      const colors = fishTypeBadgeColors[type] || { bg: "#F0F4F8", color: "#4A5568" };
                      return (
                        <span key={type} style={{ background: colors.bg, color: colors.color, padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                          {type}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
          background: "#0A3D62", color: "white", padding: "12px 20px", borderRadius: "50px",
          fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 600, zIndex: 999, whiteSpace: "nowrap"
        }}>{toast}</div>
      )}
    </div>
  );
}