import { useState } from "react";
import { useApp } from "./context/AppContext";

export default function RoleSelectPage() {
  const { state, dispatch } = useApp();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "buyer",
      icon: "🛒",
      title: "Buyer / Customer",
      desc: "Browse fresh seafood from local fishermen, place orders, and get fish delivered nearby.",
      features: ["Browse 100+ fresh items", "Real-time prices", "Track orders", "Rate & review"],
      color: "#00B4D8",
      bg: "linear-gradient(135deg, #E8F9FF, #CAF0F8)"
    },
    {
      id: "seller",
      icon: "🎣",
      title: "Seller / Fisherman",
      desc: "List your fresh product, set prices, manage inventory, and connect with buyers nearby.",
      features: ["List your product", "AI price suggestions", "Manage orders", "Analytics dashboard"],
      color: "#2ECC71",
      bg: "linear-gradient(135deg, #E8FFF3, #C8F5E0)"
    }
  ];

  const confirm = () => {
    if (!selected) return;

    setLoading(true);

    setTimeout(() => {
      dispatch({
        type: "SET_USER",
        payload: {
          ...(state.user || {}),
          role: selected,
          name: selected === "buyer" ? "Arjun Kumar" : "Rajan Fisher",
          orders: 0
        }
      });

      dispatch({
        type: "SET_PAGE",
        payload: selected === "seller" ? "seller" : "home"
      });

    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8F0", padding: "0 0 40px" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0A3D62, #1A5276)",
          padding: "40px 24px 30px",
          textAlign: "center"
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "4px" }}>
          Step 2 of 2
        </p>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "24px",
            fontWeight: 800,
            color: "white",
            marginBottom: "6px"
          }}
        >
          Who are you? 👋
        </h1>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
          Select your role to get started
        </p>
      </div>

      <div style={{ padding: "24px 20px" }}>
        {roles.map(role => (
          <div
            key={role.id}
            onClick={() => setSelected(role.id)}
            style={{
              background: selected === role.id ? role.bg : "white",
              border: `2px solid ${selected === role.id ? role.color : "rgba(0,180,216,0.15)"}`,
              borderRadius: "20px",
              padding: "22px 20px",
              marginBottom: "16px",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: selected === role.id ? role.color : "#F0F4F8",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px"
                }}
              >
                {role.icon}
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#0A3D62",
                    marginBottom: "6px"
                  }}
                >
                  {role.title}
                </h3>

                <p style={{ fontSize: "13px", color: "#718096", marginBottom: "12px" }}>
                  {role.desc}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {role.features.map(f => (
                    <span
                      key={f}
                      style={{
                        background: "#F7FAFC",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px"
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          onClick={confirm}
          disabled={!selected || loading}
          style={{ opacity: selected ? 1 : 0.5, marginTop: "8px" }}
        >
          {loading ? "Loading..." : `Continue as ${selected || ""}`}
        </button>
      </div>
    </div>
  );
}