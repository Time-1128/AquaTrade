import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

export default function FishCard({ fish, onAdd }) {

  const { state, dispatch } = useApp();

  const freshness = fish.freshness || 80;

  const freshnessColor =
    freshness >= 90
      ? "#2ECC71"
      : freshness >= 75
      ? "#F6C90E"
      : "#E74C3C";

  const stock = Number(fish.stock || 0);

  const cartItem = state.cart.find((i) => i.id === fish.id);
  const cartQty = cartItem ? cartItem.qty : 0;

  const remainingStock = stock - cartQty;

  const canAdd = remainingStock > 0;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
      className="card"
      style={{
        cursor: "pointer",
        overflow: "visible",
        position: "relative",
        opacity: stock === 0 ? 0.6 : 1
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
          padding: "20px",
          textAlign: "center",
          fontSize: "48px"
        }}
      >

        {imageList.length > 0 ? (

          <img
            src={imageList[activeImageIndex]}
            alt={fish.name}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "10px"
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

        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: freshnessColor
          }}
        />

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