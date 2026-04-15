import { useState, useEffect, useMemo } from "react";
import { useApp } from "./context/AppContext";
import Toast from "./components/Toast";

export default function ProductDetailPage() {

  const { state, dispatch } = useApp();
  const fish = state.selectedProduct;

  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

          <p style={{ color: "#718096", fontSize: "13px" }}>
            {fish.type} • {fish.category}
          </p>

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

          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            Seller Price
          </p>

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

        {/* TABS */}

        <div style={{ display: "flex", padding: "0 16px" }}>
          {["details", "seller"].map((t) => (
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
              <p>🏬 Shop: {fish.sellerShopName || "AquaTrade Seller"}</p>
              <p>🎣 Seller: {fish.sellerName || "Seller"}</p>
              <p>📞 Phone: {fish.sellerPhone || "Not provided"}</p>
              <p>
                📍 {fish.location?.address || fish.address || fish.sellerAddress || "Location unavailable"}
              </p>

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  onClick={openMaps}
                  className="btn-secondary"
                  disabled={!(fish.location?.address || fish.address || fish.sellerAddress || (fish.location?.lat && fish.location?.lng))}
                  style={{ flex: 1 }}
                >
                  View on Maps
                </button>
                <button
                  onClick={() => {
                    if (!fish.sellerPhone) return;
                    window.location.href = `tel:${fish.sellerPhone}`;
                  }}
                  className="btn-primary"
                  disabled={!fish.sellerPhone}
                  style={{ flex: 1, background: fish.sellerPhone ? "#2ECC71" : "#9CA3AF" }}
                >
                  Call Seller
                </button>
              </div>
              <button
                type="button"
                style={{ marginTop: "8px", width: "100%", border: "1px dashed #94A3B8", borderRadius: "10px", padding: "10px", background: "#F8FAFC", color: "#64748B" }}
              >
                Chat with Seller (Coming Soon)
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
          Add {qty}kg – ₹{displayPrice * qty}
        </button>

      </div>

      {toast && <Toast message={toast} />}

    </div>

  );

}