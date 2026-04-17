import { useState, useEffect, useMemo } from "react";
import { useApp } from "./context/AppContext";
import Toast from "./components/Toast";

export default function ProductDetailPage() {

  const { state, dispatch } = useApp();
  const fish = state.selectedProduct;

  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const freshnessText = useMemo(() => {
    if (!fish?.catchDateTime) return "";

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
  }, [fish?.catchDateTime]);

  const freshnessColor = useMemo(() => {
    if (!fish?.catchDateTime) return "#6B7280";

    const catchTime = new Date(fish.catchDateTime).getTime();
    const now = Date.now();
    const diffHours = (now - catchTime) / (1000 * 60 * 60);

    if (diffHours < 6) return "#16A34A";
    if (diffHours < 24) return "#F59E0B";
    return "#6B7280";
  }, [fish?.catchDateTime]);

  useEffect(() => {

    if (!fish) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }
  }, [fish, dispatch]);

  if (!fish) return null;

  /* ===============================
     TOAST
  ================================ */

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ===============================
     ADD TO CART
  ================================ */

  const addToCart = () => {

    dispatch({
      type: "ADD_TO_CART",
      payload: { ...fish, qty }
    });

    showToast(`${qty}kg ${fish.name} added to cart! 🛒`);

  };

  /* ===============================
     GOOGLE MAPS
  ================================ */

  const openMaps = () => {

    const address =
      fish.location?.address ||
      fish.address ||
      fish.sellerAddress;

    if (fish?.location?.lat && fish?.location?.lng) {
      const url = `https://www.google.com/maps?q=${fish.location.lat},${fish.location.lng}`;
      window.open(url, "_blank");
      return;
    }

    if (address) {
      const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, "_blank");
      return;
    }

    alert("Location not available");

  };

  const normalizedImages = useMemo(() => {
    const source = Array.isArray(fish.images) && fish.images.length
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

  const displayPrice = Number(fish.price || 0);

  return (

    <div className="app-container" style={{ background: "white" }}>

      {/* ===============================
          BACK + CART
      ================================ */}

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,180,216,0.1)"
        }}
      >

        <button
          onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
          style={{
            background: "#F0F9FF",
            border: "none",
            borderRadius: "12px",
            padding: "10px 18px",
            color: "#0A3D62",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            minHeight: "44px",
          }}
        >
          ← Back
        </button>

        <button
          onClick={() => dispatch({ type: "SET_PAGE", payload: "cart" })}
          style={{
            background: "#0A3D62",
            border: "none",
            borderRadius: "12px",
            padding: "10px 18px",
            color: "white",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            minHeight: "44px",
          }}
        >
          🛒 Cart ({state.cart?.reduce((s, i) => s + i.qty, 0) || 0})
        </button>

      </div>

      {/* ===============================
          CONTENT
      ================================ */}

      <div style={{ paddingBottom: "120px" }}>

        {/* IMAGE */}

        <div
          style={{
            background: `linear-gradient(160deg, ${fish.color}30, ${fish.color}10)`,
            padding: "40px 20px",
            textAlign: "center"
          }}
        >

          {normalizedImages.length > 0 ? (
            <img
              src={normalizedImages[activeImageIndex]}
              alt={fish.name}
              style={{
                width: "160px",
                height: "160px",
                objectFit: "cover",
                borderRadius: "16px",
                marginBottom: "10px"
              }}
            />
          ) : (
            <div style={{ fontSize: "100px" }}>{fish.image}</div>
          )}

          {normalizedImages.length > 1 && (
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                justifyContent: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              {normalizedImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  style={{
                    border: activeImageIndex === index ? "2px solid #0F4C75" : "1px solid #D1D5DB",
                    borderRadius: "8px",
                    overflow: "hidden",
                    padding: 0,
                    width: "44px",
                    height: "44px",
                    cursor: "pointer",
                  }}
                >
                  <img src={image} alt={`preview-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}

          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "26px",
              fontWeight: 800,
              color: "#0A3D62"
            }}
          >
            {fish.name}
          </h1>

          <p style={{ color: "#718096", fontSize: "15px", marginTop: "4px" }}>
            {fish.type} • {fish.category}
          </p>

          {freshnessText && (
            <div
              style={{
                display: "inline-block",
                marginTop: "12px",
                fontSize: "14px",
                color: freshnessColor,
                fontWeight: 700,
                background: "rgba(255,255,255,0.8)",
                padding: "6px 14px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}
            >
              {freshnessText}
            </div>
          )}

        </div>

        {/* PRICE */}

        <div
          style={{
            margin: "16px",
            background: "linear-gradient(135deg,#0F4C75,#1D6FA8)",
            borderRadius: "20px",
            padding: "16px",
            color: "white"
          }}
        >

          <p style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>Seller Price</p>

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "32px",
              fontWeight: 800
            }}
          >
            ₹{displayPrice}/kg
          </h2>

        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "22px" }}>

          <section>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                marginBottom: "10px"
              }}
            >
              About this item
            </h3>
            <p style={{ color: "#4A5568", lineHeight: 1.7, marginBottom: "8px", fontSize: "15px" }}>
              {fish.description || "No description provided."}
            </p>
          </section>

          <section style={{ background: "#F8FAFC", borderRadius: "18px", padding: "16px" }}>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                marginBottom: "12px"
              }}
            >
              Seller Information
            </h3>
            <p style={{ fontWeight: 700, color: "#0A3D62", marginBottom: "8px", fontSize: "16px" }}>🏬 {fish.sellerShopName || "AquaTrade Seller"}</p>
            {fish.sellerName ? (
              <p style={{ color: "#4A5568", marginBottom: "6px", fontSize: "15px" }}>👤 {fish.sellerName}</p>
            ) : null}
            <p style={{ color: "#4A5568", marginBottom: "6px", fontSize: "15px", fontWeight: 600 }}>📞 Hidden until booking</p>
            <p style={{ color: "#4A5568", marginBottom: "6px", fontSize: "15px", fontWeight: 600 }}>
              📍 Exact location provided after booking
            </p>
            {typeof fish.distanceKm === "number" && (
              <p style={{ color: "#4A5568", marginBottom: "6px", fontSize: "15px" }}>
                🚚 {fish.distanceKm.toFixed(1)} km approx distance
              </p>
            )}
            {fish.rating && (
              <p style={{ color: "#4A5568", marginBottom: "12px", fontSize: "15px" }}>
                ⭐ {fish.rating.toFixed(1)} ({fish.reviews || 0} reviews)
              </p>
            )}
            <div style={{ display: "grid", gap: "10px", opacity: 0.65 }}>
              <button
                type="button"
                className="btn-primary"
                disabled={true}
                style={{
                  width: "100%",
                  background: "#9CA3AF",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: 700,
                  cursor: "not-allowed"
                }}
              >
                🔒 Call Seller (After booking)
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={true}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #94A3B8",
                  padding: "12px",
                  background: "#F1F5F9",
                  color: "#64748B",
                  fontWeight: 700,
                  cursor: "not-allowed"
                }}
              >
                🔒 View Maps (After booking)
              </button>
            </div>
          </section>

        </div>

      </div>

      {/* ===============================
          BOTTOM ADD CART
      ================================ */}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "480px",
          background: "white",
          padding: "12px 20px",
          display: "flex",
          gap: "10px",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
        }}
      >

        <button
          style={{ padding: "0 18px", background: "#F1F5F9", border: "none", borderRadius: "10px", fontSize: "22px", fontWeight: 800, color: "#0A3D62", cursor: "pointer", minHeight: "50px" }}
          onClick={() => setQty((q) => Math.max(0.25, q - 0.25))}
        >
          −
        </button>

        <div style={{ padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "70px", background: "#F8FAFC", borderRadius: "10px", fontWeight: 800, color: "#0A3D62", fontSize: "16px", minHeight: "50px" }}>
          {qty}kg
        </div>

        <button
          style={{ padding: "0 18px", background: "#F1F5F9", border: "none", borderRadius: "10px", fontSize: "22px", fontWeight: 800, color: "#0A3D62", cursor: "pointer", minHeight: "50px" }}
          onClick={() => setQty((q) => q + 0.25)}
        >
          +
        </button>

        <button
          onClick={addToCart}
          className="btn-primary"
          style={{ flex: 1, padding: "14px 12px", fontSize: "16px" }}
        >
          Add {qty}kg – ₹{displayPrice * qty}
        </button>

      </div>

      {toast && <Toast message={toast} />}

    </div>

  );

}