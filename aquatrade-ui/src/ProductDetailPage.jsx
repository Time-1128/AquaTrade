import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext";
import Toast from "./components/Toast";

/* ===============================
   AI PRICE PREDICTION
================================ */

function predictPrice(fish) {
  if (!fish) return 0;

  let base = fish.price;

  const freshnessMultiplier =
    fish.freshness >= 90 ? 1.0 : fish.freshness >= 75 ? 0.92 : 0.8;

  const demandRandom = 0.95 + Math.random() * 0.1;

  const stockPressure =
    fish.stock <= 5 ? 1.1 : fish.stock >= 20 ? 0.95 : 1.0;

  const hour = new Date().getHours();

  const timeFactor =
    hour >= 6 && hour <= 10
      ? 1.05
      : hour >= 17 && hour <= 20
      ? 1.08
      : 1.0;

  return Math.round(
    base * freshnessMultiplier * demandRandom * stockPressure * timeFactor
  );
}

export default function ProductDetailPage() {

  const { state, dispatch } = useApp();
  const fish = state.selectedProduct;

  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");
  const [aiPrice, setAiPrice] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [rating, setRating] = useState(0);
  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => {

    if (!fish) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }

    setAiPrice(predictPrice(fish));

  }, [fish, dispatch]);

  if (!fish) return null;

  /* ===============================
     FRESHNESS LABELS
  ================================ */

  const freshnessColor =
    fish.freshness >= 90
      ? "#2ECC71"
      : fish.freshness >= 75
      ? "#F6C90E"
      : "#E74C3C";

  const freshnessLabel =
    fish.freshness >= 90
      ? "Very Fresh"
      : fish.freshness >= 75
      ? "Fresh"
      : "Moderate";

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

    if (!fish?.location) {
      alert("Location not available");
      return;
    }

    const url = `https://www.google.com/maps?q=${fish.location.lat},${fish.location.lng}`;
    window.open(url, "_blank");

  };

  /* ===============================
     ORDER COUNT SAFE
  ================================ */

  const orderCount = state.orders?.length || 0;

  const discountPercent =
    orderCount < 3 ? 20 : fish.discount || 0;

  const finalPrice = Math.round(
    aiPrice * (1 - discountPercent / 100)
  );

  /* ===============================
     IMAGE FIX
  ================================ */

  const imageUrl =
    fish.image && fish.image !== "🐟" && fish.image !== "?"
      ? fish.image.startsWith("http")
        ? fish.image
        : `http://localhost:5000/${fish.image}`
      : null;

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
          onClick={() =>
            dispatch({ type: "SET_PAGE", payload: "home" })
          }
          style={{
            background: "#F0F9FF",
            border: "none",
            borderRadius: "12px",
            padding: "8px 16px",
            color: "#0A3D62",
            cursor: "pointer",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700
          }}
        >
          ← Back
        </button>

        <button
          onClick={() =>
            dispatch({ type: "SET_PAGE", payload: "cart" })
          }
          style={{
            background: "#0A3D62",
            border: "none",
            borderRadius: "12px",
            padding: "8px 16px",
            color: "white",
            cursor: "pointer",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700
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

          {imageUrl ? (
            <img
              src={imageUrl}
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

          <p style={{ color: "#718096", fontSize: "13px" }}>
            {fish.type} • {fish.category}
          </p>

        </div>

        {/* PRICE */}

        <div
          style={{
            margin: "16px",
            background: "linear-gradient(135deg,#0A3D62,#00B4D8)",
            borderRadius: "20px",
            padding: "16px",
            color: "white"
          }}
        >

          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            🤖 AI Dynamic Price
          </p>

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "32px",
              fontWeight: 800
            }}
          >
            ₹{finalPrice}/kg
          </h2>

          {orderCount < 3 && (
            <p style={{ fontSize: "12px", color: "#90E0EF" }}>
              🎁 First order 20% applied
            </p>
          )}

        </div>

        {/* TABS */}

        <div style={{ display: "flex", padding: "0 16px" }}>
          {["details", "seller", "reviews"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                background: "none",
                borderBottom:
                  activeTab === t
                    ? "3px solid #00B4D8"
                    : "3px solid transparent",
                color:
                  activeTab === t ? "#00B4D8" : "#718096",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}

        <div style={{ padding: "16px" }}>

          {activeTab === "details" && (
            <>
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700
                }}
              >
                About this fish
              </h3>

              <p style={{ color: "#4A5568" }}>
                {fish.description}
              </p>
            </>
          )}

          {activeTab === "seller" && (
            <>
              <p>🎣 Seller: {fish.sellerName}</p>
              <p>📍 {fish.location?.address || "Location unavailable"}</p>

              <button
                onClick={openMaps}
                className="btn-secondary"
              >
                View on Maps
              </button>
            </>
          )}

          {activeTab === "reviews" && (
            <>
              <button
                onClick={() => setShowRateModal(true)}
                className="btn-secondary"
              >
                Rate this fish
              </button>
            </>
          )}

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
          gap: "10px"
        }}
      >

        <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>

        <span>{qty}</span>

        <button onClick={() => setQty((q) => q + 1)}>
          +
        </button>

        <button
          onClick={addToCart}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          Add {qty}kg – ₹{finalPrice * qty}
        </button>

      </div>

      {toast && <Toast message={toast} />}

    </div>

  );

}