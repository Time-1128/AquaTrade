import { useState, useEffect, useRef } from "react";
import { useApp } from "./context/AppContext";
import { db } from "./firebase.config";
import { collection, getDocs } from "firebase/firestore";
import FishCard from "./components/FishCard";
import FilterPanel from "./components/FilterPanel";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";

export default function HomePage() {

  const { state, dispatch } = useApp();
  const { fish, searchQuery, filters, activeTab, cart } = state;

  const [showFilters, setShowFilters] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const searchRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ==========================
     FETCH FISH FROM FIRESTORE
  ========================== */

  const fetchFish = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, "products");
      const querySnapshot = await getDocs(productsRef);

      const fishData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      dispatch({
        type: "SET_FISH",
        payload: fishData || [],
      });
    } catch (err) {
      console.error("Firestore fetch error:", err);
      showToast("Failed to load fish. Check Firestore.");
      dispatch({ type: "SET_FISH", payload: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFish();
  }, []);

  /* ==========================
     VOICE SEARCH
  ========================== */

  const startVoice = () => {

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      showToast("Voice search not supported");
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {

      const transcript = e.results[0][0].transcript;

      dispatch({
        type: "SET_SEARCH",
        payload: transcript
      });

      setListening(false);

    };

    recognition.onerror = () => {
      setListening(false);
      showToast("Voice recognition error");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();

  };

  /* ==========================
     FILTER LOGIC
  ========================== */

  const filtered = (Array.isArray(fish) ? fish : []).filter((f) => {

    if (!f) return false;

    const price = Number(f.price || 0);
    const rating = Number(f.rating || 0);

    if (searchQuery) {

      const q = searchQuery.toLowerCase();

      if (
        !f.name?.toLowerCase().includes(q) &&
        !f.category?.toLowerCase().includes(q)
      ) return false;

    }

    if (filters.category !== "All" && f.category !== filters.category)
      return false;

    if (filters.fishType !== "All") {
      const fishTypes = Array.isArray(f.fishTypes) ? f.fishTypes : [];
      if (!fishTypes.includes(filters.fishType)) return false;
    }

    if (price < filters.priceRange[0] || price > filters.priceRange[1])
      return false;

    if (rating < filters.minRating)
      return false;

    return true;

  });

  const sorted = [...filtered];

  switch (filters.sortBy) {
    case "priceLowHigh":
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;
    case "priceHighLow":
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;
    case "ratingHighLow":
      sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      break;
    default:
      break;
  }

  /* ==========================
     ADD TO CART
  ========================== */

  const addToCart = (item) => {

    if (!item) return;

    const stock = Number(item.stock || 0);

    const cartItem = cart.find((i) => i.id === item.id);
    const cartQty = cartItem ? cartItem.qty : 0;

    if (cartQty >= stock) {

      showToast("Maximum stock reached");
      return;

    }

    dispatch({
      type: "ADD_TO_CART",
      payload: item
    });

    showToast(`${item.name} added to cart`);

  };

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0);

  return (

    <div className="app-container">

      {/* HEADER */}

      <div
        style={{
          background: "linear-gradient(135deg,#0A3D62,#1A5276)",
          padding: "16px 20px 0",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "14px"
          }}
        >

          <div>
            📍 Marina Beach Area
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
              Chennai
            </p>
          </div>

          <div style={{ position: "relative" }}>

            <button
              onClick={() =>
                dispatch({
                  type: "SET_PAGE",
                  payload: "cart"
                })
              }
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "12px",
                padding: "8px 12px",
                color: "white",
                fontSize: "18px",
                cursor: "pointer"
              }}
            >
              🛒
            </button>

            {cartCount > 0 && (

              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#FF6B6B",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 800
                }}
              >
                {cartCount}
              </span>

            )}

          </div>

        </div>

        {/* SEARCH */}

        <div style={{ marginBottom: "14px" }}>

          <div
            style={{
              background: "white",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              padding: "2px 12px"
            }}
          >

            🔍

            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) =>
                dispatch({
                  type: "SET_SEARCH",
                  payload: e.target.value
                })
              }
              placeholder="Search fish..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "12px 8px"
              }}
            />

            <button
              onClick={() => setShowFilters(true)}
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              ⚙️
            </button>

            <button
              onClick={startVoice}
              style={{
                background: "#00B4D8",
                border: "none",
                borderRadius: "10px",
                padding: "8px 12px",
                color: "white",
                cursor: "pointer"
              }}
            >
              🎤
            </button>

          </div>

        </div>

      </div>

      {/* GRID */}

      <div
  className="scrollable-content"
  style={{
    padding: "16px",
    overflowY: "auto",
    height: "calc(100vh - 160px)",
    paddingBottom: "80px"
  }}
>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : sorted.length === 0 ? (

          <div style={{ textAlign: "center", padding: "60px" }}>
            No fish available
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}
          >

            {sorted.map((f) => (

              <FishCard
                key={f.id}
                fish={f}
                onAdd={() => addToCart(f)}
              />

            ))}

          </div>

        )}

      </div>

      {showFilters && (
        <FilterPanel onClose={() => setShowFilters(false)} />
      )}

      <BottomNav />

      {toast && <Toast message={toast} />}

    </div>

  );

}