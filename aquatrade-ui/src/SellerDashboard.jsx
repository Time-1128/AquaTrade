import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext";

const SUPPLIES = [
  { id: "ice", name: "Ice Blocks (20kg)", price: 80, icon: "🧊", desc: "Premium cold storage ice" },
  { id: "box", name: "Fish Storage Box", price: 350, icon: "📦", desc: "Insulated 50L container" },
  { id: "net", name: "Fishing Net (5m)", price: 1200, icon: "🕸️", desc: "Nylon mesh netting" },
  { id: "salt", name: "Sea Salt (5kg)", price: 45, icon: "🧂", desc: "For preservation" },
];

export default function SellerDashboard() {

  const { state, dispatch } = useApp();
  const { sellerProducts, orders } = state;

  const [activeTab, setActiveTab] = useState("dashboard");

  const [bookings, setBookings] = useState([]);

  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "Sea water",
    category: "Fish",
    price: "",
    stock: "",
    freshness: "1hour",
    description: ""
  });

  const freshnessOptions = [
    { id: "1hour", label: "🕐 1 Hour", value: "1 hour" },
    { id: "1day", label: "📅 1 Day", value: "1 day" },
    { id: "3days", label: "📅 3 Days", value: "3 days" },
    { id: "1week", label: "📅 1 Week", value: "1 week" }
  ];

  const [toast, setToast] = useState("");
  const [supplyCart, setSupplyCart] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ---------------- FETCH BOOKINGS ---------------- */

  const fetchBookings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/seller");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /* ---------------- ADD FISH ---------------- */

  const addFish = async () => {

    if (!form.name || !form.price || !form.stock) {
      showToast("Fill all required fields");
      return;
    }

    try {

      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("freshness", form.freshness);
      formData.append("description", form.description);
      formData.append("sellerName", state.user?.name || "Your Store");

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("http://localhost:5000/api/fish", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      const newFish = {
        id: data.id || Date.now(),
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        image: data.image || "🐟",
        sellerName: state.user?.name || "Your Store",
        color: "#00B4D8"
      };

      dispatch({
        type: "ADD_SELLER_PRODUCT",
        payload: newFish
      });

      setForm({
        name: "",
        type: "Sea water",
        category: "Fish",
        price: "",
        stock: "",
        freshness: "1hour",
        description: ""
      });

      setImageFile(null);

      showToast("Fish listed successfully! 🎉");

    } catch (error) {

      console.error(error);
      showToast("Failed to save fish to server");

    }

  };

  /* ---------------- SUPPLY CART ---------------- */

  const addSupply = (item) => {

    setSupplyCart((prev) => {

      const exists = prev.find((p) => p.id === item.id);

      if (exists) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }

      return [...prev, { ...item, qty: 1 }];

    });

    showToast(`${item.name} added`);

  };

  /* ---------------- STATS ---------------- */

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalOrders = orders.length;

  return (
    <div className="app-container">

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1A5276, #2ECC71)", padding: "20px 20px 30px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Welcome back,</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "white" }}>
              {state.user?.name || "Fisherman"} 🎣
            </h1>
          </div>

          <button
            onClick={() => {
              dispatch({ type: "SET_USER", payload: null });
              dispatch({ type: "SET_PAGE", payload: "login" });
            }}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "10px",
              padding: "8px 12px",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { label: "Revenue", value: `₹${totalRevenue}`, icon: "💰" },
            { label: "Orders", value: totalOrders, icon: "📦" },
            { label: "Listed", value: sellerProducts.length, icon: "🐟" }
          ].map(s => (
            <div key={s.label}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "12px",
                textAlign: "center",
                backdropFilter: "blur(10px)"
              }}>
              <p style={{ fontSize: "18px" }}>{s.icon}</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "white" }}>{s.value}</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
            </div>
          ))}
        </div>

      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "white", borderBottom: "2px solid #F0F4F8" }}>
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "add", label: "➕ Add Fish" },
          { id: "bookings", label: "📦 Bookings" },
          { id: "supplies", label: "🧊 Supplies" },
          { id: "listings", label: "📋 Listings" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: "12px 4px",
              border: "none",
              background: "none",
              borderBottom: `3px solid ${activeTab === t.id ? "#2ECC71" : "transparent"}`,
              color: activeTab === t.id ? "#1A5276" : "#718096",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="scrollable-content" style={{ padding: "16px" }}>

        {activeTab === "add" && (

          <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62", marginBottom: "18px" }}>
              🐟 List Your Catch
            </h3>

            <input className="input-field" placeholder="Fish Name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

            <input className="input-field" type="number" placeholder="Price per kg"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />

            <input className="input-field" type="number" placeholder="Stock (kg)"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />

            <div style={{ marginBottom: "18px" }}>
              <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62", marginBottom: "12px" }}>
                ⏰ Time of Catch / Freshness
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {freshnessOptions.map(option => (
                  <label key={option.id} style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: form.freshness === option.id ? "2px solid #2ECC71" : "2px solid #E0E0E0",
                    background: form.freshness === option.id ? "rgba(46, 204, 113, 0.1)" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}>
                    <input
                      type="radio"
                      name="freshness"
                      value={option.id}
                      checked={form.freshness === option.id}
                      onChange={e => setForm(f => ({ ...f, freshness: e.target.value }))}
                      style={{
                        marginRight: "8px",
                        cursor: "pointer",
                        width: "18px",
                        height: "18px"
                      }}
                    />
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0A3D62"
                    }}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <textarea className="input-field" placeholder="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />

            <button
              onClick={addFish}
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #2ECC71, #27AE60)",
                border: "none",
                borderRadius: "50px",
                color: "white",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "12px"
              }}
            >
              List Fish for Sale 🐟
            </button>

          </div>

        )}

      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0A3D62",
          color: "white",
          padding: "12px 20px",
          borderRadius: "50px",
          fontSize: "14px",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          zIndex: 999
        }}>
          {toast}
        </div>
      )}

    </div>
  );
}