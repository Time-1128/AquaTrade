import { useState } from "react";
import { useApp } from "./context/AppContext";
import { auth, db } from "./firebase.config";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";   // ← add this
import BottomNav from "./components/BottomNav";

export default function ProfilePage() {

const { state, dispatch } = useApp();
const { user, orders } = state;

const [activeTab, setActiveTab] = useState("orders");

const [editing, setEditing] = useState(false);

const [form, setForm] = useState({
name: user?.name || "",
email: user?.email || ""
});

const savedAddresses = [
{ label: "Home", icon: "🏠", addr: "12, Marina Beach Rd, Chennai - 600001" },
{ label: "Work", icon: "💼", addr: "45, Anna Salai, Chennai - 600002" }
];

const stats = [
{ label: "Orders", value: orders?.length || 0, icon: "📦" },
{ label: "Loyalty Pts", value: (orders?.length || 0) * 50, icon: "⭐" },
{ label: "Saved", value: "₹" + (orders?.length || 0) * 80, icon: "💰" }
];

const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
  }
  dispatch({ type: "LOGOUT" });
};

const saveProfile = async () => {

try {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Please log in first");
    return;
  }

  const userDocRef = doc(db, "users", currentUser.uid);
  await updateDoc(userDocRef, form);

  dispatch({
    type: "SET_USER",
    payload: { ...user, ...form }
  });

  setEditing(false);
  alert("Profile updated successfully!");

} catch (err) {
  console.error("Profile update failed:", err);
  alert("Failed to update profile: " + err.message);
}

};

/* SAFE IMAGE RESOLVER */

const resolveImage = (img) => {


if (!img || img === "🐟" || img === "?") return null;

if (img.startsWith("http")) return img;

return `http://localhost:5000/${img}`;


};

return ( <div className="app-container">


  {/* Header */}

  <div
    style={{
      background: "linear-gradient(160deg, #0A3D62, #00B4D8)",
      padding: "30px 20px 80px",
      position: "relative"
    }}
  >

    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>

      <div
        style={{
          width: "64px",
          height: "64px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          border: "3px solid rgba(255,255,255,0.3)"
        }}
      >
        {user?.role === "seller" ? "🎣" : "👤"}
      </div>

      <div>

        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "20px",
            fontWeight: 800,
            color: "white"
          }}
        >
          {user?.name || "User"}
        </h2>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
          +91 {user?.phone || "0000000000"}
        </p>

        <span
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "white",
            padding: "2px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600
          }}
        >
          {user?.role === "seller" ? "🎣 Fisherman" : "🛒 Buyer"}
        </span>

        <button
          onClick={() => setEditing(true)}
          style={{
            marginTop: "10px",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            background: "#00B4D8",
            color: "white",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Edit Profile
        </button>

      </div>

    </div>

    {editing && (

      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "16px"
        }}
      >

        <input
          className="input-field"
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          className="input-field"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <button
          className="btn-primary"
          onClick={saveProfile}
        >
          Save Changes
        </button>

      </div>

    )}

    <div style={{ display: "flex", gap: "10px" }}>

      {stats.map((s) => (

        <div
          key={s.label}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "12px",
            textAlign: "center"
          }}
        >

          <p style={{ fontSize: "18px", marginBottom: "2px" }}>{s.icon}</p>

          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "18px",
              color: "white"
            }}
          >
            {s.value}
          </p>

          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>
            {s.label}
          </p>

        </div>

      ))}

    </div>

  </div>

  {/* Tabs */}

  <div style={{ display: "flex", padding: "16px 16px 0" }}>
    {["orders", "addresses", "care"].map((t) => (
      <button
        key={t}
        onClick={() => setActiveTab(t)}
        style={{
          flex: 1,
          padding: "10px",
          border: "none",
          background: "none",
          borderBottom: activeTab === t ? "3px solid #00B4D8" : "3px solid transparent",
          color: activeTab === t ? "#00B4D8" : "#718096",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          cursor: "pointer"
        }}
      >
        {t === "care" ? "Support" : t === "addresses" ? "Addresses" : "Orders"}
      </button>
    ))}
  </div>

  <div className="scrollable-content" style={{ padding: "16px" }}>

    {activeTab === "orders" &&
      (orders.length === 0 ? (

        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontWeight: 700 }}>No orders yet</p>
          <button
            className="btn-primary"
            onClick={() =>
              dispatch({ type: "SET_PAGE", payload: "home" })
            }
          >
            Shop Now
          </button>
        </div>

      ) : (

        orders.map((order) => (

          <div
            key={order.id}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "12px"
            }}
          >

            <p style={{ fontWeight: 800 }}>Token #{order.id}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {order.items?.map((i) => {

                const img = resolveImage(i.image);

                return (
                  <span key={i.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>

                    {img ? (
                      <img
                        src={img}
                        alt={i.name}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      "🐟"
                    )}

                    {i.name} ×{i.qty}

                  </span>
                );
              })}
            </div>

            <p>₹{order.total}</p>

          </div>

        ))

      ))}

    {activeTab === "addresses" && (
      <>
        {savedAddresses.map((a) => (
          <div key={a.label}>
            {a.icon} {a.label} – {a.addr}
          </div>
        ))}
      </>
    )}

    {activeTab === "care" && (

      <button
        onClick={logout}
        style={{
          width: "100%",
          padding: "14px",
          background: "#FFF0F0",
          border: "2px solid #FFCCCC",
          borderRadius: "16px",
          color: "#E74C3C",
          fontWeight: 700
        }}
      >
        🚪 Logout
      </button>

    )}

  </div>

  <BottomNav />

</div>


);
}
