import { useState } from "react";
import { useApp } from "./context/AppContext";
import { db, auth } from "./firebase.config";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ProfileSetup() {
  const { dispatch } = useApp();
  const currentUser = auth.currentUser;
  const isExistingAuthenticated = !!currentUser?.uid;
  const [form, setForm] = useState({
    name: "",
    email: currentUser?.email || "",
    password: "",
    phoneNumber: currentUser?.phoneNumber || "",
    role: "",
    address: "",
    location: null,
    shopName: "",
    description: "",
    availableTiming: "",
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
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
          setForm((f) => ({ ...f, address, location: { lat, lng } }));
          setError("");
        } catch {
          setError("Could not resolve address. Please enter manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError("Location access denied. Enter address manually.");
      }
    );
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Full name is required.");
    if (!isExistingAuthenticated && !isValidEmail(form.email.trim())) return setError("Enter a valid email.");
    if (!isExistingAuthenticated && (!form.password || form.password.length < 6)) return setError("Password must be at least 6 characters.");
    if (!form.role) return setError("Please select a role.");
    if (!form.address.trim()) return setError("Address is required.");
    if (form.role === "seller" && !form.phoneNumber.trim()) return setError("Phone number is required for sellers.");
    if (form.phoneNumber && !/^\+?\d{10,15}$/.test(form.phoneNumber.replace(/\s/g, ""))) {
      return setError("Enter a valid phone number.");
    }

    if (
      form.role === "seller" &&
      (!form.shopName.trim() || !form.availableTiming.trim())
    ) {
      return setError("Please complete seller details.");
    }

    setError("");
    setLoading(true);
    dispatch({ type: "SET_ASK_PROFILE_SETUP", payload: false });

    try {
      let uid = currentUser?.uid;
      let email = currentUser?.email || "";
      let phoneNumber = currentUser?.phoneNumber || "";

      if (!isExistingAuthenticated) {
        email = form.email.trim().toLowerCase();
        const existingMethods = await fetchSignInMethodsForEmail(auth, email);
        if (existingMethods.length > 0) {
          setError("Email already exists. Please login instead.");
          setLoading(false);
          return;
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, form.password);
        uid = userCred.user.uid;
        phoneNumber = userCred.user.phoneNumber || "";
      }

      if (!uid) throw new Error("Authentication session missing. Please login/signup again.");

      const profileData = {
        uid,
        name: form.name.trim(),
        email: email || "",
        phoneNumber: form.phoneNumber.trim() || phoneNumber || "",
        role: form.role,
        address: form.address.trim(),
        location: form.location || null,
        createdAt: serverTimestamp(),
        ...(form.role === "seller" && {
          shopName: form.shopName.trim(),
          description: form.description.trim(),
          availableTiming: form.availableTiming.trim(),
        }),
      };

      await setDoc(doc(db, "users", uid), profileData, { merge: true });

      dispatch({ type: "SET_USER", payload: profileData });
      dispatch({ type: "SET_PAGE", payload: form.role === "seller" ? "seller" : "home" });
    } catch (err) {
      const msg = {
        "auth/email-already-in-use": "Email already registered. Please login.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Password is too weak (minimum 6 characters).",
        "auth/operation-not-allowed":
          "Email/Password signup is not enabled in Firebase Authentication. Enable it in Firebase Console > Authentication > Sign-in method.",
      };
      setError(msg[err.code] || err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    fontWeight: 700,
    fontSize: "13px",
    color: "#0F4C75",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.3px",
  };

  const roleCard = (value, emoji, title, subtitle) => {
    const selected = form.role === value;
    return (
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, role: value }))}
        style={{
          flex: 1,
          padding: "14px 10px",
          borderRadius: "12px",
          border: selected ? "2px solid #2ECC71" : "1px solid #DDE3EA",
          background: selected ? "rgba(46, 204, 113, 0.1)" : "white",
          cursor: "pointer",
        }}
      >
        <p style={{ fontSize: "24px", marginBottom: "4px" }}>{emoji}</p>
        <p style={{ color: "#0F4C75", fontWeight: 700, fontSize: "14px" }}>{title}</p>
        <p style={{ color: "#6B7280", fontSize: "11px", marginTop: "2px" }}>{subtitle}</p>
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "linear-gradient(160deg, #0F4C75 0%, #00B4D8 100%)",
          padding: "48px 24px 68px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>🐟</div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "8px" }}>Create your AquaTrade account</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>Sign up with email and set your profile</p>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: "200%",
            height: "50px",
            background: "#F5F7FA",
            borderRadius: "50% 50% 0 0",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div style={{ padding: "0 20px 36px", marginTop: "-8px" }}>
        <div style={{ background: "white", borderRadius: "18px", padding: "22px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <label style={labelStyle}>Full Name *</label>
          <input className="input-field" placeholder="e.g. Arjun Kumar" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          {!isExistingAuthenticated && (
            <>
              <label style={{ ...labelStyle, marginTop: "10px" }}>Email *</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />

              <label style={{ ...labelStyle, marginTop: "10px" }}>Password *</label>
              <input className="input-field" type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </>
          )}

          {isExistingAuthenticated && (
            <div style={{ marginBottom: "10px", color: "#4B5563", fontSize: "13px" }}>
              Signed in as: <strong>{currentUser?.email || currentUser?.phoneNumber}</strong>
            </div>
          )}

          <label style={{ ...labelStyle, marginTop: "10px" }}>Phone Number {form.role === "seller" ? "*" : ""}</label>
          <input
            className="input-field"
            type="tel"
            placeholder="+91 9876543210"
            value={form.phoneNumber}
            onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
          />

          <label style={{ ...labelStyle, marginTop: "10px" }}>I am a *</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            {roleCard("buyer", "🛒", "Buyer", "Browse and order")}
            {roleCard("seller", "🎣", "Seller", "List your catch")}
          </div>

          <label style={labelStyle}>Address *</label>
          <input className="input-field" placeholder="Your city or area" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />

          <button
            type="button"
            onClick={useCurrentLocation}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #CDE8F0",
              background: "rgba(0,180,216,0.08)",
              color: "#0F4C75",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "10px",
              marginBottom: "14px",
            }}
          >
            {geoLoading ? "Detecting location..." : "Use current location"}
          </button>

          {form.role === "seller" && (
            <div style={{ border: "1px solid #DDE3EA", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
              <label style={labelStyle}>Shop Name *</label>
              <input className="input-field" placeholder="e.g. Chennai Fresh Catch" value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} />
              <label style={{ ...labelStyle, marginTop: "10px" }}>Description *</label>
              <textarea className="input-field" placeholder="About your fish and services (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <label style={{ ...labelStyle, marginTop: "10px" }}>Available Timing *</label>
              <input className="input-field" placeholder="Mon-Sat, 6 AM - 10 AM" value={form.availableTiming} onChange={(e) => setForm((f) => ({ ...f, availableTiming: e.target.value }))} />
            </div>
          )}

          {error && (
            <div style={{ background: "#FFF1F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" }}>
              <p style={{ color: "#B91C1C", fontSize: "13px" }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
            style={{
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #2ECC71, #27AE60)",
            }}
          >
            {loading ? "Creating account..." : "Continue"}
          </button>

          <p style={{ textAlign: "center", marginTop: "14px", color: "#6B7280", fontSize: "14px" }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_PAGE", payload: "login" })}
              style={{ background: "none", border: "none", color: "#0F4C75", fontWeight: 700, cursor: "pointer" }}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
