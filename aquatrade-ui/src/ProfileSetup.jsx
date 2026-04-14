import { useState } from "react";
import { useApp } from "./context/AppContext";
import { db, auth } from "./firebase.config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ProfileSetup() {
  const { state, dispatch } = useApp();

  const [form, setForm] = useState({
    name: "",
    role: "",
    address: "",
    shopName: "",
    description: "",
    availableTiming: "",
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- GEOLOCATION ---------------- */

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm((f) => ({ ...f, address }));
          setError("");
        } catch {
          setError("Could not resolve address. Please type it manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError("Location access denied. Please type your address.");
      }
    );
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.role) { setError("Please select a role."); return; }
    if (!form.address.trim()) { setError("Address is required."); return; }

    if (form.role === "seller" && (!form.shopName.trim() || !form.description.trim() || !form.availableTiming.trim())) {
      setError("Please complete all seller details before proceeding.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      const profileData = {
        uid: currentUser.uid,
        phoneNumber: currentUser.phoneNumber || state.user?.phoneNumber || "",
        name: form.name.trim(),
        role: form.role,
        address: form.address.trim(),
        createdAt: serverTimestamp(),
        ...(form.role === "seller" && {
          shopName: form.shopName.trim(),
          description: form.description.trim(),
          availableTiming: form.availableTiming.trim(),
        }),
      };

      await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });

      // Update global state
      dispatch({ type: "SET_USER", payload: { ...state.user, ...profileData } });

      // Navigate based on role
      dispatch({
        type: "SET_PAGE",
        payload: form.role === "seller" ? "seller" : "home",
      });
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STYLES ---------------- */

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1.5px solid #E2E8F0",
    fontSize: "15px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#2D3748",
    background: "#FAFAFA",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
    transition: "border 0.2s",
  };

  const labelStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    color: "#0A3D62",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  };

  /* ── role card ── */
  const roleCard = (value, emoji, title, subtitle) => {
    const selected = form.role === value;
    return (
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, role: value }))}
        style={{
          flex: 1,
          padding: "16px 12px",
          borderRadius: "14px",
          border: selected ? "2.5px solid #2ECC71" : "1.5px solid #E2E8F0",
          background: selected ? "rgba(46,204,113,0.08)" : "white",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.2s",
        }}
      >
        <p style={{ fontSize: "28px", marginBottom: "6px" }}>{emoji}</p>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          color: selected ? "#1A5276" : "#4A5568",
        }}>
          {title}
        </p>
        <p style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>{subtitle}</p>
      </button>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div style={{ minHeight: "100vh", background: "#F0F7FF", display: "flex", flexDirection: "column" }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: "linear-gradient(160deg, #0A3D62 0%, #1A8CB0 100%)",
        padding: "48px 24px 72px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "160px", height: "160px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />
        <div style={{
          position: "absolute", bottom: "30px", left: "-30px",
          width: "100px", height: "100px",
          borderRadius: "50%",
          background: "rgba(46,204,113,0.15)",
        }} />

        <div style={{ fontSize: "52px", marginBottom: "14px" }}>🐟</div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "26px",
          fontWeight: 800,
          color: "white",
          marginBottom: "8px",
        }}>
          Set Up Your Profile
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.75)",
          fontSize: "14px",
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: "280px",
          margin: "0 auto",
        }}>
          Tell us a bit about yourself to get started on AquaTrade
        </p>

        {/* wave divider */}
        <div style={{
          position: "absolute",
          bottom: 0, left: "50%",
          width: "200%", height: "50px",
          background: "#F0F7FF",
          borderRadius: "50% 50% 0 0",
          transform: "translateX(-50%)",
        }} />
      </div>

      {/* ── FORM CARD ── */}
      <div style={{ padding: "0 20px 40px", marginTop: "-10px" }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "28px 22px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>

          {/* Step indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}>
            <div style={{
              width: "28px", height: "28px",
              borderRadius: "50%",
              background: "#0A3D62",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 700,
            }}>1</div>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: "15px", color: "#0A3D62",
            }}>
              Basic Information
            </p>
          </div>

          {/* Name */}
          <label style={labelStyle}>Full Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g. Arjun Kumar"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          {/* Role selection */}
          <label style={{ ...labelStyle, marginBottom: "10px" }}>I am a *</label>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            {roleCard("buyer", "🛒", "Buyer", "Browse & order fresh fish")}
            {roleCard("seller", "🎣", "Seller", "List & sell your catch")}
          </div>

          {/* Address */}
          <label style={labelStyle}>Address *</label>
          <input
            style={inputStyle}
            placeholder="Your city or area"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />

          {/* Geolocation button */}
          <button
            type="button"
            onClick={useCurrentLocation}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              border: "1.5px solid #00B4D8",
              background: "rgba(0,180,216,0.06)",
              color: "#0A3D62",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {geoLoading ? "📡 Detecting location…" : "📍 Use My Current Location"}
          </button>

          {/* ── SELLER EXTRA FIELDS ── */}
          {form.role === "seller" && (
            <div style={{
              background: "rgba(46,204,113,0.06)",
              border: "1.5px solid rgba(46,204,113,0.3)",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "16px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}>
                <div style={{
                  width: "28px", height: "28px",
                  borderRadius: "50%",
                  background: "#2ECC71",
                  color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700,
                }}>2</div>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: "15px", color: "#1A5276",
                }}>
                  Seller Details
                </p>
              </div>

              <label style={labelStyle}>Shop / Fisher Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Chennai Fresh Catch"
                value={form.shopName}
                onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              />

              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
                placeholder="Tell buyers about your fish, specialty, experience…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />

              <label style={labelStyle}>Available Timing (optional)</label>
              <input
                style={{ ...inputStyle, marginBottom: 0 }}
                placeholder="e.g. Mon–Sat, 6 AM – 10 AM"
                value={form.availableTiming}
                onChange={(e) => setForm((f) => ({ ...f, availableTiming: e.target.value }))}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF0F0",
              border: "1px solid #FECACA",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <p style={{ color: "#C0392B", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading
                ? "#A0AEC0"
                : "linear-gradient(135deg, #2ECC71, #27AE60)",
              border: "none",
              borderRadius: "50px",
              color: "white",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(46,204,113,0.4)",
              transition: "all 0.2s",
            }}
          >
            {loading
              ? "Saving…"
              : form.role === "seller"
              ? "Go to Seller Dashboard 🎣"
              : "Start Shopping 🛒"}
          </button>

          <p style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#A0AEC0",
            marginTop: "16px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            You can update this info later from your profile
          </p>
        </div>
      </div>
    </div>
  );
}