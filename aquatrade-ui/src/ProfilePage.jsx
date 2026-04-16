import { useState } from "react";
import { useApp } from "./context/AppContext";
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

  const cardStyle = {
    background: "white",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 4px 14px rgba(15,76,117,0.06)",
  };

  return (
    <div className={`app-container ${isSeller ? "seller-theme" : ""}`} style={{ background: pageBg }}>
      <div style={{ background: headerGradient, padding: "24px 18px", color: "white" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800 }}>👤 Profile</h2>
        <p style={{ marginTop: "6px", opacity: 0.86, fontSize: "13px" }}>
          Manage your account and contact details
        </p>
      </div>

      <div className="scrollable-content" style={{ padding: "14px" }}>
        <div style={cardStyle}>
          <p style={{ color: "#6B7280", fontSize: "12px", marginBottom: "4px" }}>Role</p>
          <div style={{ marginBottom: "12px" }}>
            <span style={{
              background: isSeller ? "#DCFCE7" : "#E0F2FE",
              color: isSeller ? "#166534" : "#0A3D62",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 800,
              display: "inline-block",
              border: `1px solid ${isSeller ? "#86EFAC" : "#7DD3FC"}`
            }}>
              {isSeller ? "Seller" : "Buyer"}
            </span>
          </div>

          <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700 }}>Full Name</label>
          <input className="input-field" value={form.name} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Email</label>
          <input className="input-field" value={form.email} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />

          <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Phone Number</label>
          <input className="input-field" value={form.phoneNumber} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />

          <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Address</label>
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
              style={{ width: "100%", marginTop: "8px", border: "1px solid #D1D5DB", borderRadius: "12px", background: "white", padding: "12px", cursor: "pointer", color: themePrimary, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              📍 Use current location
            </button>
          )}

          {user?.role === "seller" && (
            <>
              <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Shop Name</label>
              <input className="input-field" value={form.shopName} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} />

              <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Description</label>
              <textarea className="input-field" value={form.description} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

              <label style={{ fontSize: "12px", color: "#334155", fontWeight: 700, marginTop: "8px", display: "block" }}>Available Timing</label>
              <input className="input-field" value={form.availableTiming} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, availableTiming: e.target.value }))} />
            </>
          )}

          {error && <p style={{ color: "#B91C1C", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
          {message && <p style={{ color: "#047857", fontSize: "13px", marginTop: "10px" }}>{message}</p>}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {editing ? (
              <>
                <button
                  onClick={saveProfile}
                  disabled={loading}
                  style={{ flex: 1, border: "none", borderRadius: "10px", background: "#2ECC71", color: "white", padding: "10px", fontWeight: 700, cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  style={{ flex: 1, border: "1px solid #D1D5DB", borderRadius: "10px", background: "white", padding: "10px", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                  style={{ width: "100%", border: "none", borderRadius: "10px", background: themePrimary, color: "white", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {!isSeller && (
          <div style={{ ...cardStyle, marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#F5F8FB", padding: "16px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
              <p style={{ color: "#64748B", fontSize: "12px" }}>Wallet Balance</p>
              <h3 style={{ color: themePrimary, fontWeight: 900, fontSize: "24px", marginTop: "4px" }}>
                ₹{user?.walletBalance !== undefined ? user?.walletBalance : 500}
              </h3>
            </div>
            
            <div style={{ background: "#ECFDF5", padding: "16px", borderRadius: "14px", border: "1px solid #A7F3D0" }}>
              <p style={{ color: "#065F46", fontSize: "12px", fontWeight: 700 }}>Coupons</p>
              <h3 style={{ color: "#047857", fontWeight: 900, fontSize: "24px", marginTop: "4px" }}>
                {user?.tokens || 0}
              </h3>
              <p style={{ color: "#059669", fontSize: "11px", marginTop: "4px", fontWeight: 600 }}>
                You have {user?.tokens || 0} free coupons
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          style={{ width: "100%", marginTop: "12px", border: "1px solid #FCA5A5", borderRadius: "14px", background: "#FEF2F2", color: "#B91C1C", padding: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease" }}
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
