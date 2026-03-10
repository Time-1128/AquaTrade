import { useState } from "react";
import { useApp } from "../context/AppContext";
import BottomNav from "./components//BottomNav";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user, orders } = state;
  const [activeTab, setActiveTab] = useState("orders");

  const savedAddresses = [
    { label: "Home", icon: "🏠", addr: "12, Marina Beach Rd, Chennai - 600001" },
    { label: "Work", icon: "💼", addr: "45, Anna Salai, Chennai - 600002" }
  ];

  const stats = [
    { label: "Orders", value: orders.length, icon: "📦" },
    { label: "Loyalty Pts", value: orders.length * 50, icon: "⭐" },
    { label: "Saved", value: "₹" + orders.length * 80, icon: "💰" }
  ];

  return (
    <div className="app-container">
      {/* Profile header */}
      <div style={{ background: "linear-gradient(160deg, #0A3D62, #00B4D8)", padding: "30px 20px 80px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ width: "64px", height: "64px", background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", border: "3px solid rgba(255,255,255,0.3)" }}>
            {user?.role === "seller" ? "🎣" : "👤"}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "white" }}>
              {user?.name || "User"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>+91 {user?.phone}</p>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "white", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
              {user?.role === "seller" ? "🎣 Fisherman" : "🛒 Buyer"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "10px" }}>
          {stats.map(s => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: "14px", padding: "12px", textAlign: "center" }}>
              <p style={{ fontSize: "18px", marginBottom: "2px" }}>{s.icon}</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "white" }}>{s.value}</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: "50%", width: "200%", height: "40px", background: "#FFF8F0", borderRadius: "50% 50% 0 0", transform: "translateX(-50%)" }} />
      </div>

      {/* Loyalty banner */}
      {orders.length < 3 && (
        <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg, #FF6B6B, #E74C3C)", borderRadius: "16px", padding: "14px 18px", color: "white" }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "14px", marginBottom: "4px" }}>🎁 First Order Rewards Active!</p>
          <p style={{ fontSize: "12px", opacity: 0.9 }}>You have {3 - orders.length} more discounted orders. Keep ordering!</p>
        </div>
      )}

      {orders.length >= 3 && (
        <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg, #F6C90E, #D4A017)", borderRadius: "16px", padding: "14px 18px", color: "white" }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "14px", marginBottom: "4px" }}>🏆 Loyal Customer!</p>
          <p style={{ fontSize: "12px", opacity: 0.9 }}>You've earned {orders.length * 50} loyalty points. Redeem for rewards!</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", padding: "16px 16px 0" }}>
        {["orders", "addresses", "care"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: "10px", border: "none", background: "none",
            borderBottom: `3px solid ${activeTab === t ? "#00B4D8" : "transparent"}`,
            color: activeTab === t ? "#00B4D8" : "#718096",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px",
            cursor: "pointer", textTransform: "capitalize"
          }}>{t === "care" ? "Support" : t === "addresses" ? "Addresses" : "Orders"}</button>
        ))}
      </div>

      <div className="scrollable-content" style={{ padding: "16px" }}>
        {activeTab === "orders" && (
          orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#A0AEC0" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>📦</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", color: "#4A5568", marginBottom: "8px" }}>No orders yet</p>
              <p style={{ fontSize: "14px" }}>Start exploring fresh seafood!</p>
              <button className="btn-primary" style={{ width: "auto", padding: "10px 24px", marginTop: "16px" }}
                onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}>Shop Now</button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,180,216,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px", color: "#0A3D62" }}>Token #{order.id}</p>
                    <p style={{ fontSize: "12px", color: "#A0AEC0" }}>{order.date}</p>
                  </div>
                  <span style={{ background: "#E8FFF3", color: "#1A7A4C", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                    ✓ {order.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {order.items.map(i => (
                    <span key={i.id} style={{ background: "#F0F4F8", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "#0A3D62" }}>
                      {i.image} {i.name} ×{i.qty}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F0F4F8", paddingTop: "10px" }}>
                  <span style={{ fontSize: "13px", color: "#718096" }}>📅 Slot: {order.slot}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px", color: "#0A3D62" }}>₹{order.total}</span>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "addresses" && (
          <>
            {savedAddresses.map(a => (
              <div key={a.label} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", display: "flex", gap: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ width: "44px", height: "44px", background: "#F0F9FF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", marginBottom: "4px" }}>{a.label}</p>
                  <p style={{ fontSize: "13px", color: "#718096" }}>{a.addr}</p>
                </div>
              </div>
            ))}
            <button style={{ width: "100%", padding: "14px", border: "2px dashed #00B4D8", borderRadius: "16px", background: "none", color: "#00B4D8", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              + Add New Address
            </button>
          </>
        )}

        {activeTab === "care" && (
          <>
            {[
              { icon: "📞", title: "Customer Care", value: "+91 1800-AQUA-123", subtitle: "24/7 Support" },
              { icon: "📧", title: "Email Support", value: "help@aquafresh.in", subtitle: "Response within 2 hours" },
              { icon: "💬", title: "Live Chat", value: "Chat Now", subtitle: "Available 6AM – 10PM" },
              { icon: "❓", title: "FAQ", value: "View FAQ", subtitle: "Common questions answered" },
            ].map(item => (
              <div key={item.title} style={{ background: "white", borderRadius: "16px", padding: "16px", marginBottom: "10px", display: "flex", gap: "14px", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", cursor: "pointer" }}>
                <div style={{ width: "44px", height: "44px", background: "#E8F9FF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>{item.title}</p>
                  <p style={{ fontSize: "13px", color: "#00B4D8", fontWeight: 600 }}>{item.value}</p>
                  <p style={{ fontSize: "11px", color: "#A0AEC0" }}>{item.subtitle}</p>
                </div>
                <span style={{ color: "#A0AEC0" }}>›</span>
              </div>
            ))}
            <button onClick={() => { dispatch({ type: "SET_USER", payload: null }); dispatch({ type: "SET_PAGE", payload: "login" }); }}
              style={{ width: "100%", padding: "14px", background: "#FFF0F0", border: "2px solid #FFCCCC", borderRadius: "16px", color: "#E74C3C", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", cursor: "pointer", marginTop: "8px" }}>
              🚪 Logout
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
