import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

export default function FishCard({ fish, onAdd }) {

  const { state, dispatch } = useApp();

  const stock = Number(fish.stock || 0);

  const cartItem = state.cart.find((i) => i.id === fish.id);
  const cartQty = cartItem ? cartItem.qty : 0;

  const remainingStock = stock - cartQty;

  const canAdd = remainingStock > 0;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Freshness calculation
 const freshnessText = useMemo(() => {
  if (!fish.catchDateTime) return "";

  const catchTime = new Date(fish.catchDateTime).getTime();
  const now = Date.now();
  const diffMs = now - catchTime;

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `🕒 Caught ${diffMins} mins ago`;
  } 
  else if (diffHours < 24) {
    return `🕒 Caught ${diffHours} hrs ago`;
  } 
  else {
    const remainingHours = diffHours % 24;
    return `🕒 Caught ${diffDays}d ${remainingHours}h ago`;
  }
}, [fish.catchDateTime]);

  const freshnessColor = useMemo(() => {
  if (!fish.catchDateTime) return "#6B7280";

  const catchTime = new Date(fish.catchDateTime).getTime();
  const now = Date.now();
  const diffHours = (now - catchTime) / (1000 * 60 * 60);

  if (diffHours < 6) return "#16A34A"; // green (very fresh)
  if (diffHours < 24) return "#F59E0B"; // orange (moderate)
  return "#6B7280"; // gray (old - neutral, not error)
}, [fish.catchDateTime]);

  const handleAdd = (e) => {

    e.stopPropagation();

    if (!canAdd) {
      alert("Maximum stock reached");
      return;
    }

    onAdd();

  };

  /* IMAGE NORMALIZATION */

  const imageList = useMemo(() => {
    const source =
      Array.isArray(fish.images) && fish.images.length
        ? fish.images
        : fish.image && fish.image !== "🐟"
        ? [fish.image]
        : [];
    return source
      .map((image) =>
        image.startsWith("http") || image.startsWith("data:image")
          ? image
          : `http://localhost:5000/${image}`
      )
      .slice(0, 5);
  }, [fish.image, fish.images]);

  return (

    <div
      className="card product-card"
      style={{
        cursor: "pointer",
        overflow: "visible",
        position: "relative",
        opacity: stock === 0 ? 0.6 : 1,
        padding: 0,
      }}
      onClick={() => dispatch({ type: "SELECT_PRODUCT", payload: fish })}
    >

      {fish.discount ? (

        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "10px",
            background: "#FF6B6B",
            color: "white",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 800
          }}
        >
          {fish.discount}% OFF
        </div>

      ) : null}

      <div
        style={{
          background: `${fish.color || "#00B4D8"}20`,
          padding: "16px",
          textAlign: "center",
          minHeight: "148px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >

        {imageList.length > 0 ? (

          <img
            src={imageList[activeImageIndex]}
            alt={fish.name}
            style={{
              width: "100%",
              maxWidth: "220px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "16px"
            }}
          />

        ) : (

          fish.image || "🐟"

        )}

        {imageList.length > 1 && (
          <div style={{ marginTop: "8px", display: "flex", justifyContent: "center", gap: "6px" }}>
            {imageList.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveImageIndex(index);
                }}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  border: "none",
                  background: activeImageIndex === index ? "#0F4C75" : "#CBD5E1",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {freshnessText && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              fontSize: "12px",
              color: freshnessColor,
              fontWeight: 600,
              background: "rgba(255,255,255,0.9)",
              padding: "2px 6px",
              borderRadius: "6px"
            }}
          >
            {freshnessText}
          </div>
        )}

      </div>

      <div style={{ padding: "14px" }}>

        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1F2937" }}>
          {fish.name}
        </h3>

        <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
          ⭐ {fish.rating || 4.5} ({fish.reviews || 0})
        </div>

        <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
          {fish.sellerShopName || "AquaTrade Seller"} • {fish.sellerName || "Seller"}
        </div>
        {typeof fish.distanceKm === "number" && (
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
            📍 {fish.distanceKm.toFixed(1)} km away
          </div>
        )}

        <div
          style={{
            fontSize: "12px",
            marginTop: "6px",
            fontWeight: 600,
            color: stock === 0 ? "#E74C3C" : "#555"
          }}
        >
          {stock === 0
            ? "Out of Stock"
            : `Available: ${remainingStock} kg`}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px"
          }}
        >

          <div style={{ fontWeight: 800, fontSize: "18px", color: "#0F4C75" }}>
            ₹{fish.price}/kg
          </div>

          <button
            disabled={!canAdd}
            onClick={handleAdd}
            style={{
              background: canAdd ? "#00B4D8" : "#ccc",
              border: "none",
              borderRadius: "8px",
              color: "white",
              width: "36px",
              height: "36px",
              cursor: canAdd ? "pointer" : "not-allowed"
            }}
          >
            +
          </button>

        </div>

      </div>

    </div>

  );

}