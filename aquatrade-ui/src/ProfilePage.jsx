import { useState } from "react";
import { useApp } from "./context/AppContext";
import logo from "./assets/logo.png";
import { auth, db } from "./firebase.config";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import BottomNav from "./components/BottomNav";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user } = state;
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    address: user?.address || "",
    location: user?.location || null,
    shopName: user?.shopName || "",
    description: user?.description || "",
    availableTiming: user?.availableTiming || "",
  });
  const isSeller = user?.role === "seller";
  const themePrimary = isSeller ? "#2ECC71" : "#0F4C75";
  const pageBg = isSeller ? "#EAFBF0" : "#F5F7FA";
  const headerGradient = isSeller
    ? "linear-gradient(160deg, #2ECC71, #1F9D5A)"
    : "linear-gradient(160deg, #0F4C75, #1D6FA8)";

  /* ── Phone: digits only, max 10 ── */
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, phoneNumber: digits }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm((f) => ({ ...f, address, location: { lat, lng } }));
          setError("");
        } catch {
          setError("Could not fetch address from location.");
        }
      },
      () => setError("Location permission denied.")
    );
  };

  const saveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return setError("Please login again.");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.address.trim()) return setError("Address is required.");
    if (form.phoneNumber && form.phoneNumber.length !== 10) {
      return setError("Phone number must be exactly 10 digits.");
    }
    if (user?.role === "seller" && (!form.shopName.trim() || !form.phoneNumber.trim())) {
      return setError("Shop name and phone are required for sellers.");
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        location: form.location || null,
        ...(user?.role === "seller" && {
          shopName: form.shopName.trim(),
          description: form.description.trim(),
          availableTiming: form.availableTiming.trim(),
        }),
      };
      await updateDoc(doc(db, "users", currentUser.uid), payload);
      dispatch({ type: "SET_USER", payload: { ...user, ...payload } });
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
    dispatch({ type: "LOGOUT" });
  };

  // Coupon progress
  const totalPurchases = Number(user?.totalPurchases || 0);
  const purchasesRemaining = 5 - (totalPurchases % 5);
  const showProgress = totalPurchases > 0 && purchasesRemaining < 5;

  const cardStyle = {
    background: "white",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 4px 14px rgba(15,76,117,0.06)",
  };

  const labelStyle = {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 700,
    marginTop: "10px",
    display: "block",
    marginBottom: "4px",
  };

  return (
    <div className={`app-container ${isSeller ? "seller-theme" : ""}`} style={{ background: pageBg }}>
      {/* ── Header: logo img kept, no box background ── */}
      <div style={{ background: headerGradient, padding: "20px 18px 18px", color: "white" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Profile</h2>
        <p style={{ marginTop: "4px", opacity: 0.86, fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
          Manage your account and contact details
        </p>
      </div>

      <div className="scrollable-content" style={{ padding: "14px", paddingBottom: "120px" }}>

        {/* ── Coupon progress (buyer only) ── */}
        {!isSeller && showProgress && (
          <div className="coupon-banner" style={{ marginBottom: "14px" }}>
            <span className="coupon-banner-icon">🎁</span>
            <span className="coupon-banner-text">
              Buy {purchasesRemaining} more to earn a FREE coupon!
            </span>
          </div>
        )}

        <div style={cardStyle}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Role</label>
          <div style={{ marginBottom: "12px" }}>
            <span style={{
              background: isSeller ? "#DCFCE7" : "#E0F2FE",
              color: isSeller ? "#166534" : "#0A3D62",
              padding: "5px 14px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 800,
              display: "inline-block",
              border: `1px solid ${isSeller ? "#86EFAC" : "#7DD3FC"}`,
            }}>
              {isSeller ? "Seller" : "Buyer"}
            </span>
          </div>

          <label style={labelStyle}>Full Name</label>
          <input
            className="input-field"
            value={form.name}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <label style={labelStyle}>Email</label>
          <input
            className="input-field"
            value={form.email}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />

          <label style={labelStyle}>Phone Number</label>
          <input
            className="input-field"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phoneNumber}
            disabled={!editing}
            onChange={handlePhoneChange}
            placeholder="10 digit number"
          />
          {editing && (
            <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>
              Digits only · max 10
            </p>
          )}

          <label style={labelStyle}>Address</label>
          <textarea
            className="input-field"
            value={form.address}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            style={{ minHeight: "100px", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          />

          {editing && (
            <button
              type="button"
              onClick={useCurrentLocation}
              style={{
                width: "100%",
                marginTop: "8px",
                border: "1px solid #D1D5DB",
                borderRadius: "12px",
                background: "white",
                padding: "12px",
                cursor: "pointer",
                color: themePrimary,
                fontWeight: 700,
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              📍 Use current location
            </button>
          )}

          {user?.role === "seller" && (
            <>
              <label style={labelStyle}>Shop Name</label>
              <input
                className="input-field"
                value={form.shopName}
                disabled={!editing}
                onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              />

              <label style={labelStyle}>Description</label>
              <textarea
                className="input-field"
                value={form.description}
                disabled={!editing}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />

              <label style={labelStyle}>Available Timing</label>
              <input
                className="input-field"
                value={form.availableTiming}
                disabled={!editing}
                onChange={(e) => setForm((f) => ({ ...f, availableTiming: e.target.value }))}
              />
            </>
          )}

          {error && <p style={{ color: "#B91C1C", fontSize: "14px", marginTop: "10px" }}>{error}</p>}
          {message && <p style={{ color: "#047857", fontSize: "14px", marginTop: "10px" }}>{message}</p>}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            {editing ? (
              <>
                <button
                  onClick={saveProfile}
                  disabled={loading}
                  style={{ flex: 1, border: "none", borderRadius: "10px", background: "#2ECC71", color: "white", padding: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={() => { setEditing(false); setError(""); }}
                  style={{ flex: 1, border: "1px solid #D1D5DB", borderRadius: "10px", background: "white", padding: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{ width: "100%", border: "none", borderRadius: "10px", background: themePrimary, color: "white", padding: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Wallet & Coupons (buyer only) ── */}
        {!isSeller && (
          <div style={{ ...cardStyle, marginTop: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#F5F8FB", padding: "16px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <p style={{ color: "#64748B", fontSize: "13px", fontWeight: 600 }}>Wallet Balance</p>
                <h3 style={{ color: themePrimary, fontWeight: 900, fontSize: "26px", marginTop: "4px" }}>
                  ₹{user?.walletBalance !== undefined ? user?.walletBalance : 500}
                </h3>
              </div>

              <div style={{ background: "#ECFDF5", padding: "16px", borderRadius: "14px", border: "1px solid #A7F3D0" }}>
                <p style={{ color: "#065F46", fontSize: "13px", fontWeight: 700 }}>Coupons</p>
                <h3 style={{ color: "#047857", fontWeight: 900, fontSize: "26px", marginTop: "4px" }}>
                  {user?.tokens || 0}
                </h3>
                <p style={{ color: "#059669", fontSize: "12px", marginTop: "4px", fontWeight: 600 }}>
                  Earn 1 per 5 purchases
                </p>
              </div>
            </div>

            {/* Progress bar toward next coupon */}
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>Next coupon progress</span>
                <span style={{ fontSize: "13px", color: "#059669", fontWeight: 700 }}>
                  {totalPurchases % 5}/5
                </span>
              </div>
              <div style={{ height: "8px", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${((totalPurchases % 5) / 5) * 100}%`,
                    background: "linear-gradient(90deg, #2ECC71, #059669)",
                    borderRadius: "4px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
                {purchasesRemaining === 5
                  ? "Complete your first purchase to start earning!"
                  : `${purchasesRemaining} more purchase${purchasesRemaining !== 1 ? "s" : ""} to earn a free coupon 🎁`}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          style={{
            width: "100%",
            marginTop: "12px",
            border: "1px solid #FCA5A5",
            borderRadius: "14px",
            background: "#FEF2F2",
            color: "#B91C1C",
            padding: "14px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
        >
          Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
