import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function FilterPanel({ onClose }) {
  const { state, dispatch } = useApp();
  const { filters } = state;
  const [local, setLocal] = useState({ ...filters });

  const apply = () => {
    dispatch({ type: "SET_FILTERS", payload: local });
    onClose();
  };

  const reset = () => {
    const def = { type: "All", category: "All", priceRange: [0, 3000], minRating: 0, maxDistance: 10, maxEta: 60, discount: false };
    setLocal(def);
    dispatch({ type: "SET_FILTERS", payload: def });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(10,61,98,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0",
        padding: "24px 20px 40px", width: "100%", maxWidth: "480px", margin: "0 auto",
        animation: "slideUp 0.3s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "#0A3D62" }}>
            ⚙️ Filters
          </h2>
          <button onClick={reset} style={{ color: "#FF6B6B", background: "none", border: "none", fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer" }}>
            Reset All
          </button>
        </div>

        {/* Price range */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", display: "block", marginBottom: "10px" }}>
            💰 Price Range: ₹{local.priceRange[0]} – ₹{local.priceRange[1]}
          </label>
          <input type="range" min={0} max={3000} step={50} value={local.priceRange[1]}
            onChange={e => setLocal(l => ({ ...l, priceRange: [0, +e.target.value] }))}
            style={{ width: "100%", accentColor: "#00B4D8" }} />
        </div>

        {/* Rating */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", display: "block", marginBottom: "10px" }}>
            ⭐ Minimum Rating: {local.minRating || "Any"}
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[0, 3, 3.5, 4, 4.5].map(r => (
              <button key={r} onClick={() => setLocal(l => ({ ...l, minRating: r }))}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                  border: `2px solid ${local.minRating === r ? "#00B4D8" : "#E2E8F0"}`,
                  background: local.minRating === r ? "#E8F9FF" : "white",
                  color: local.minRating === r ? "#0A3D62" : "#718096",
                  fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "12px"
                }}>
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", display: "block", marginBottom: "10px" }}>
            📍 Max Distance: {local.maxDistance} km
          </label>
          <input type="range" min={1} max={20} step={0.5} value={local.maxDistance}
            onChange={e => setLocal(l => ({ ...l, maxDistance: +e.target.value }))}
            style={{ width: "100%", accentColor: "#00B4D8" }} />
        </div>

        {/* Type */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", display: "block", marginBottom: "10px" }}>
            🌊 Water Type
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["All", "Sea water", "Fresh water", "Lake", "Pond"].map(t => (
              <button key={t} onClick={() => setLocal(l => ({ ...l, type: t }))}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                  border: `2px solid ${local.type === t ? "#00B4D8" : "#E2E8F0"}`,
                  background: local.type === t ? "#E8F9FF" : "white",
                  color: local.type === t ? "#0A3D62" : "#718096",
                  fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "12px"
                }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Discount toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <label style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>
            🏷️ Show Discounted Only
          </label>
          <div onClick={() => setLocal(l => ({ ...l, discount: !l.discount }))} style={{
            width: "48px", height: "26px", borderRadius: "13px",
            background: local.discount ? "#00B4D8" : "#E2E8F0",
            position: "relative", cursor: "pointer", transition: "background 0.3s"
          }}>
            <div style={{
              position: "absolute", top: "3px",
              left: local.discount ? "24px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "white", transition: "left 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }} />
          </div>
        </div>

        <button className="btn-primary" onClick={apply} style={{ fontSize: "16px", padding: "16px" }}>
          Apply Filters ✓
        </button>
      </div>
    </div>
  );
}
