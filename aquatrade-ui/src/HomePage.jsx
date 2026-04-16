import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApp } from "./context/AppContext";
import logo from "./assets/logo.png";
import { db, auth } from "./firebase.config";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import FishCard from "./components/FishCard";
import FilterPanel from "./components/FilterPanel";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";

export default function HomePage() {

  const { state, dispatch } = useApp();
  const { fish, searchQuery, filters, cart, user } = state;

  const [showFilters, setShowFilters] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [claimingTokens, setClaimingTokens] = useState(false);

  const searchRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ==========================
     FETCH FISH FROM FIRESTORE
  ========================== */

  const fetchFish = useCallback(async () => {
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
  }, [dispatch]);

  useEffect(() => {
    fetchFish();
  }, [fetchFish]);

  useEffect(() => {
    const profileLocation = user?.location;
    if (
      profileLocation &&
      typeof profileLocation.lat === "number" &&
      typeof profileLocation.lng === "number"
    ) {
      setBuyerLocation(profileLocation);
      localStorage.setItem("aquatradeBuyerLocation", JSON.stringify(profileLocation));
      return;
    }

    const cached = localStorage.getItem("aquatradeBuyerLocation");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
          setBuyerLocation(parsed);
          return;
        }
      } catch (error) {
        console.error("Failed to parse cached buyer location", error);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const fallbackLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setBuyerLocation(fallbackLocation);
          localStorage.setItem("aquatradeBuyerLocation", JSON.stringify(fallbackLocation));
        },
        () => {}
      );
    }
  }, [user?.location]);

  useEffect(() => {
    if (user?.role === "buyer" && user?.tokenRewardClaimed !== true) {
      setShowTokenModal(true);
    }
  }, [user?.role, user?.tokenRewardClaimed]);

  const claimWelcomeTokens = async () => {
    if (!user?.uid) return;
    setClaimingTokens(true);
    try {
      // Give 1 starter coupon on first login only
      const currentTokens = Number(user?.tokens || 0);
      const nextTokens = currentTokens > 0 ? currentTokens : 1;
      await updateDoc(doc(db, "users", user.uid), {
        tokens: nextTokens,
        tokenRewardClaimed: true,
      });
      dispatch({
        type: "SET_USER",
        payload: { ...user, tokens: nextTokens, tokenRewardClaimed: true },
      });
      setShowTokenModal(false);
      showToast("Welcome! 1 starter coupon added 🎁");
    } catch (error) {
      console.error("Token claim failed:", error);
      showToast("Unable to claim coupon now");
    } finally {
      setClaimingTokens(false);
    }
  };

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

  const hasOption = (value, list = []) => list.includes(value);

  const normalizedFishType = (fishItem) => {
    const raw = (fishItem.type || fishItem.fishType || fishItem.category || "").toLowerCase();
    if (raw.includes("salt") || raw.includes("sea")) return "Sea";
    if (raw.includes("fresh")) return "Freshwater";
    if (raw.includes("canal") || raw.includes("lake") || raw.includes("river")) return "Canal/Lake";
    return "";
  };

  const inAnyPriceRange = (price, ranges) => {
    if (!ranges.length) return true;
    return ranges.some((range) => {
      switch (range) {
        case "lt1000":
          return price < 1000;
        case "1000-2000":
          return price >= 1000 && price <= 2000;
        case "2000-5000":
          return price > 2000 && price <= 5000;
        case "5000-10000":
          return price > 5000 && price <= 10000;
        case "gt10000":
          return price > 10000;
        default:
          return true;
      }
    });
  };

  const inAnyDiscountRange = (discount, ranges) => {
    if (!ranges.length) return true;
    return ranges.some((range) => {
      switch (range) {
        case "upto5":
          return discount <= 5;
        case "upto15":
          return discount <= 15;
        case "upto20":
          return discount <= 20;
        case "upto30":
          return discount <= 30;
        case "gt30":
          return discount > 30;
        default:
          return true;
      }
    });
  };

  const toRadians = (value) => (value * Math.PI) / 180;

  const calculateDistanceKm = (from, to) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(from.lat)) *
        Math.cos(toRadians(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((earthRadiusKm * c).toFixed(1));
  };

  const parseSellerLocation = (item) => {
    if (
      item?.location &&
      typeof item.location.lat === "number" &&
      typeof item.location.lng === "number"
    ) {
      return { lat: item.location.lat, lng: item.location.lng };
    }
    if (typeof item?.lat === "number" && typeof item?.lng === "number") {
      return { lat: item.lat, lng: item.lng };
    }
    return null;
  };

  const withDistance = useMemo(() => {
    const list = Array.isArray(fish) ? fish : [];
    return list.map((item) => {
      const sellerLocation = parseSellerLocation(item);
      if (!buyerLocation || !sellerLocation) {
        return { ...item, distanceKm: null };
      }
      return {
        ...item,
        distanceKm: calculateDistanceKm(buyerLocation, sellerLocation),
      };
    });
  }, [fish, buyerLocation]);

  const matchesDistanceRange = (distanceKm, ranges = []) => {
    if (!ranges.length) return true;
    if (typeof distanceKm !== "number") return false;
    return ranges.some((range) => {
      switch (range) {
        case "within1":
          return distanceKm <= 1;
        case "within5":
          return distanceKm <= 5;
        case "within10":
          return distanceKm <= 10;
        case "within20":
          return distanceKm <= 20;
        case "more20":
          return distanceKm > 20;
        default:
          return true;
      }
    });
  };

  const matchesFreshnessRange = (catchDateTime, ranges = []) => {
    if (!ranges.length) return true;
    if (!catchDateTime) return false;
    const catchTime = new Date(catchDateTime).getTime();
    const now = Date.now();
    const diffHours = (now - catchTime) / (1000 * 60 * 60);
    return ranges.some((range) => {
      switch (range) {
        case "within2h":
          return diffHours <= 2;
        case "within6h":
          return diffHours <= 6;
        case "within12h":
          return diffHours <= 12;
        case "within24h":
          return diffHours <= 24;
        case "more1d":
          return diffHours > 24;
        default:
          return true;
      }
    });
  };

  const filtered = withDistance.filter((f) => {

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

    const fishType = normalizedFishType(f);
    if (filters.fishTypes?.length && !hasOption(fishType, filters.fishTypes)) return false;
    if (!inAnyPriceRange(price, filters.priceRanges || [])) return false;

    const discount = Number(f.discount || 0);
    if (!inAnyDiscountRange(discount, filters.discounts || [])) return false;

    if (filters.ratings?.length) {
      const minSelectedRating = Math.min(...filters.ratings);
      if (rating < minSelectedRating) return false;
    }

    if (!matchesDistanceRange(f.distanceKm, filters.distanceRanges || [])) {
      return false;
    }

    if (!matchesFreshnessRange(f.catchDateTime, filters.freshnessRanges || [])) {
      return false;
    }

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
    case "nearestFirst":
      sorted.sort((a, b) => {
        const distanceA = typeof a.distanceKm === "number" ? a.distanceKm : Number.MAX_SAFE_INTEGER;
        const distanceB = typeof b.distanceKm === "number" ? b.distanceKm : Number.MAX_SAFE_INTEGER;
        return distanceA - distanceB;
      });
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
          background: "linear-gradient(to right, #0F4C75, #1B6CA8)",
          padding: "14px 16px 0",
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

          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "22px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "#FFFFFF",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                AquaTrade
              </h1>
              <p style={{ fontSize: "14px", color: "#D1E9F6", marginTop: "2px" }}>
                Fresh products from trusted sellers
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                } catch (err) {
                  console.error("Logout failed:", err);
                }
                dispatch({ type: "LOGOUT" });
              }}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                borderRadius: "10px",
                padding: "8px 10px",
                color: "white",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
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
              placeholder="Search products..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "12px 8px"
              }}
            />

            <button
              onClick={() => setShowFilters(true)}
              style={{
                border: "none",
                background: "#E6F7FE",
                borderRadius: "10px",
                cursor: "pointer",
                width: "36px",
                height: "36px",
                color: "#0A3D62",
                fontSize: "18px",
                marginRight: "6px",
              }}
            >
              ☰
            </button>

            <button
              onClick={startVoice}
              style={{
                background: listening ? "#2ECC71" : "#00B4D8",
                border: "none",
                borderRadius: "10px",
                padding: "8px 12px",
                color: "white",
                cursor: "pointer"
              }}
              title={listening ? "Listening..." : "Voice Search"}
            >
              {listening ? "🎙️" : "🎤"}
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

        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ color: "#0A3D62", fontWeight: 700 }}>
            {sorted.length} result{sorted.length === 1 ? "" : "s"} found
          </p>
        </div>

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

      {showTokenModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 900,
            animation: "fadeIn 0.25s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              animation: "slideUp 0.3s ease",
            }}
          >
            <p style={{ fontSize: "32px", textAlign: "center", marginBottom: "10px" }}>🎁</p>
            <h3 style={{ color: "#0F4C75", fontSize: "20px", fontWeight: 800, textAlign: "center" }}>
              Welcome to AquaTrade!
            </h3>
            <p style={{ marginTop: "8px", color: "#6B7280", fontSize: "14px", textAlign: "center" }}>
              You have 1 starter coupon to use on your first booking.
            </p>
            <p style={{ marginTop: "6px", color: "#059669", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>
              🎫 Earn more: 1 free coupon for every 5 purchases!
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: "16px" }}
              onClick={claimWelcomeTokens}
              disabled={claimingTokens}
            >
              {claimingTokens ? "Claiming..." : "Claim Starter Coupon"}
            </button>
          </div>
        </div>
      )}

    </div>

  );

}