import { useApp } from "../context/AppContext";

export default function FishCard({ fish, onAdd }) {
  const { dispatch } = useApp();

  const freshnessColor = fish.freshness >= 90 ? "#2ECC71" : fish.freshness >= 75 ? "#F6C90E" : "#E74C3C";

  return (
    <div
      className="card"
      style={{ cursor: "pointer", overflow: "visible", position: "relative" }}
      onClick={() => { dispatch({ type: "SET_PRODUCT", payload: fish }); dispatch({ type: "SET_PAGE", payload: "product" }); }}
    >
      {/* Discount badge */}
      {fish.discount && (
        <div style={{
          position: "absolute", top: "-6px", left: "10px",
          background: "linear-gradient(135deg, #FF6B6B, #E74C3C)",
          color: "white", padding: "3px 8px", borderRadius: "6px",
          fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: 800,
          zIndex: 2, boxShadow: "0 2px 8px rgba(231,76,60,0.4)"
        }}>{fish.discount}% OFF</div>
      )}

      {/* Tag */}
      {fish.tags?.[0] && (
        <div style={{
          position: "absolute", top: "-6px", right: "10px",
          background: fish.tags[0] === "Premium" ? "linear-gradient(135deg, #F6C90E, #D4A017)" : "linear-gradient(135deg, #00B4D8, #0A3D62)",
          color: "white", padding: "3px 8px", borderRadius: "6px",
          fontSize: "9px", fontFamily: "'Syne', sans-serif", fontWeight: 800,
          zIndex: 2
        }}>{fish.tags[0]}</div>
      )}

      {/* Image area */}
      <div style={{
        background: `linear-gradient(135deg, ${fish.color}20, ${fish.color}10)`,
        padding: "20px 10px 12px",
        textAlign: "center",
        fontSize: "48px",
        position: "relative"
      }}>
        {fish.image}
        {/* Freshness dot */}
        <div style={{
          position: "absolute", bottom: "8px", right: "8px",
          width: "10px", height: "10px", borderRadius: "50%",
          background: freshnessColor,
          boxShadow: `0 0 6px ${freshnessColor}`
        }} title={`${fish.freshness}% fresh`} />
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px 12px" }}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 700,
          color: "#0A3D62", marginBottom: "3px", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>{fish.name}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "#F6C90E" }}>★</span>
          <span style={{ fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#4A5568" }}>{fish.rating}</span>
          <span style={{ fontSize: "10px", color: "#A0AEC0" }}>({fish.reviews})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px" }}>📍</span>
          <span style={{ fontSize: "10px", color: "#718096" }}>{fish.sellerDist} km</span>
          <span style={{ fontSize: "10px", color: "#A0AEC0" }}>•</span>
          <span style={{ fontSize: "10px", color: "#718096" }}>⏱ {fish.eta}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "15px", fontWeight: 800, color: "#0A3D62" }}>
              ₹{fish.price}
              <span style={{ fontSize: "10px", color: "#A0AEC0", fontWeight: 400 }}>/kg</span>
            </div>
            {fish.originalPrice && (
              <div style={{ fontSize: "10px", color: "#A0AEC0", textDecoration: "line-through" }}>₹{fish.originalPrice}</div>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            style={{
              background: "linear-gradient(135deg, #00B4D8, #0A3D62)",
              border: "none", borderRadius: "10px",
              width: "32px", height: "32px",
              color: "white", fontSize: "18px",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,180,216,0.4)"
            }}
            onMouseEnter={e => { e.target.style.transform = "scale(1.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}
          >+</button>
        </div>
      </div>
    </div>
  );
}
