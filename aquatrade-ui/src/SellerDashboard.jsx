import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext";
import { db, auth, storage } from "./firebase.config";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SellerDashboard() {
  const { state, dispatch } = useApp();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "",
    fishTypes: [],
    address: "",
    location: null,
    type: "Sea water",
    category: "Fish",
    price: "",
    stock: "",
    catchDateTime: "",
    description: "",
  });

  const fishTypeOptions = ["Freshwater", "Saltwater", "Shellfish", "Exotic"];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ---------------- GEOLOCATION ---------------- */

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported");
      return;
    }
    setGeoLoading(true);
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
          showToast("Address filled from current location");
        } catch (err) {
          console.error(err);
          showToast("Unable to resolve address from location");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setGeoLoading(false);
        showToast("Location access denied or unavailable");
      }
    );
  };

  const openMapPicker = () => {
    window.open("https://www.openstreetmap.org", "_blank");
  };

  /* ---------------- FETCH SELLER PRODUCTS ---------------- */

  const fetchSellerProducts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const q = query(
        collection(db, "products"),
        where("sellerId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSellerProducts(products);
    } catch (err) {
      console.error("Fetch products error:", err);
      showToast("Failed to load products");
    }
  };

  /* ---------------- FETCH SELLER ORDERS ---------------- */

  const fetchSellerOrders = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const querySnapshot = await getDocs(collection(db, "orders"));
      const allOrders = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = allOrders.filter((order) =>
        Array.isArray(order.items) &&
        order.items.some((item) => item.sellerId === currentUser.uid)
      );
      setSellerOrders(filtered);
    } catch (err) {
      console.error("Fetch orders error:", err);
      showToast("Failed to load orders");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSellerProducts(), fetchSellerOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- DELETE PRODUCT ---------------- */

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      setSellerProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast("Product deleted successfully");
    } catch (err) {
      console.error("Delete product error:", err);
      showToast("Failed to delete product");
    }
  };

  /* ---------------- MARK ORDER COMPLETED ---------------- */

  const markOrderCompleted = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "Completed" });
      setSellerOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "Completed" } : order
        )
      );
      showToast("Order marked as completed");
    } catch (err) {
      console.error("Update order error:", err);
      showToast("Failed to update order");
    }
  };

  /* ---------------- ADD FISH ---------------- */

  const addFish = async () => {
    if (!form.name || !form.price || !form.stock) {
      showToast("Fill all required fields");
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Please log in first");
        return;
      }

      let imageUrl = "🐟";
      if (imageFile) {
        const storageRef = ref(
          storage,
          `products/${currentUser.uid}/${Date.now()}_${imageFile.name}`
        );
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const productData = {
        name: form.name,
        type: form.type,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        catchDateTime: form.catchDateTime,
        description: form.description,
        sellerName: state.user?.name || "Your Store",
        sellerId: currentUser.uid,
        address: form.address,
        location: form.location || null,
        fishTypes: form.fishTypes,
        image: imageUrl,
        rating: 4.5,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      const newFish = {
        id: docRef.id,
        ...productData,
        image: imageUrl,
      };

      setSellerProducts((prev) => [...prev, newFish]);

      setForm({
        name: "",
        fishTypes: [],
        address: "",
        location: null,
        type: "Sea water",
        category: "Fish",
        price: "",
        stock: "",
        catchDateTime: "",
        description: "",
      });
      setImageFile(null);
      showToast("Fish listed successfully! 🎉");
    } catch (error) {
      console.error(error);
      showToast("Failed to save fish: " + error.message);
    }
  };

  /* ---------------- STATS ---------------- */

  const totalRevenue = sellerOrders
    .filter((o) => o.status === "Completed")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = sellerOrders.length;
  const activeListings = sellerProducts.filter((p) => p.stock > 0).length;
  const recentOrders = [...sellerOrders]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  /* ---------------- STYLES ---------------- */

  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #F0F4F8",
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #2ECC71, #27AE60)",
    border: "none",
    borderRadius: "50px",
    color: "white",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    padding: "10px 18px",
  };

  const sectionTitle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "17px",
    color: "#0A3D62",
    marginBottom: "16px",
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="app-container">

      {/* ── HEADER ── */}
      <div
        style={{
          background: "#0A3D62",
          padding: "50px 24px 70px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎣</div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "white",
            marginBottom: "6px",
          }}
        >
          Seller Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
          Manage your fish listings and orders
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
              Welcome back,
            </p>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "white",
              }}
            >
              {state.user?.name || "Fisherman"}
            </h2>
          </div>

          <button
            onClick={async () => {
              try {
                await signOut(auth);
              } catch (err) {
                console.error("Seller logout failed:", err);
              }
              dispatch({ type: "LOGOUT" });
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
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── TABS (single set — duplicate removed) ── */}
      <div
        style={{
          display: "flex",
          background: "white",
          borderBottom: "2px solid #F0F4F8",
          overflowX: "auto",
        }}
      >
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "addFish",   label: "➕ Add Fish"  },
          { id: "listings",  label: "📋 Listings"  },
          { id: "orders",    label: "📦 Orders"    },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              minWidth: "80px",
              padding: "14px 4px",
              border: "none",
              background: "none",
              borderBottom: `3px solid ${activeTab === tab.id ? "#2ECC71" : "transparent"}`,
              color: activeTab === tab.id ? "#1A5276" : "#718096",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="scrollable-content" style={{ padding: "16px" }}>

        {/* ══════════════ DASHBOARD TAB ══════════════ */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {[
                { label: "Revenue",  value: `₹${totalRevenue}`, icon: "💰" },
                { label: "Orders",   value: totalOrders,         icon: "📦" },
                { label: "Active",   value: activeListings,      icon: "🐟" },
              ].map((s) => (
                <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <p style={{ fontSize: "22px", marginBottom: "4px" }}>{s.icon}</p>
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: "18px",
                      color: "#0A3D62",
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: "11px", color: "#718096" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "➕ Add Fish",    tab: "addFish"  },
                { label: "📋 Listings",    tab: "listings" },
                { label: "📦 Orders",      tab: "orders"   },
              ].map((btn) => (
                <button
                  key={btn.tab}
                  onClick={() => setActiveTab(btn.tab)}
                  style={{
                    ...btnPrimary,
                    flex: 1,
                    minWidth: "100px",
                    background:
                      btn.tab === "addFish"
                        ? "linear-gradient(135deg, #2ECC71, #27AE60)"
                        : btn.tab === "listings"
                        ? "linear-gradient(135deg, #3498DB, #2980B9)"
                        : "linear-gradient(135deg, #F39C12, #E67E22)",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Recent Orders */}
            <h3 style={sectionTitle}>🕐 Recent Orders</h3>
            {loading ? (
              <p style={{ color: "#718096", textAlign: "center" }}>Loading…</p>
            ) : recentOrders.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: "32px" }}>
                <p style={{ fontSize: "40px" }}>📦</p>
                <p style={{ color: "#718096", marginTop: "8px" }}>No orders yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recentOrders.map((order) => (
                  <div key={order.id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#0A3D62",
                          }}
                        >
                          Order #{order.orderId || order.id.slice(-6).toUpperCase()}
                        </p>
                        <p style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
                          {Array.isArray(order.items)
                            ? order.items
                                .filter((item) => item.sellerId === auth.currentUser?.uid)
                                .map((item) => `${item.name} (${item.quantity}kg)`)
                                .join(", ")
                            : "—"}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background:
                            order.status === "Completed" ? "#D4EDDA" : "#FFF3CD",
                          color:
                            order.status === "Completed" ? "#155724" : "#856404",
                        }}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ADD FISH TAB ══════════════ */}
        {activeTab === "addFish" && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ ...sectionTitle, marginBottom: "18px" }}>
              🐟 List Your Catch
            </h3>

            <input
              className="input-field"
              placeholder="Fish Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            {/* Fish Type */}
            <div style={{ margin: "16px 0" }}>
              <h4
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0A3D62",
                  marginBottom: "10px",
                }}
              >
                🧭 Fish Type
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                {fishTypeOptions.map((type) => {
                  const isSelected = form.fishTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, fishTypes: [type] }))}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: isSelected
                          ? "2px solid #2ECC71"
                          : "1px solid #E0E0E0",
                        background: isSelected
                          ? "rgba(46, 204, 113, 0.12)"
                          : "white",
                        color: "#0A3D62",
                        cursor: "pointer",
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              className="input-field"
              placeholder="Seller address or pickup location"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              <button
                type="button"
                onClick={useCurrentLocation}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  background: "white",
                  color: "#0A3D62",
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                }}
              >
                {geoLoading ? "Locating…" : "📍 Use current location"}
              </button>

              <button
                type="button"
                onClick={openMapPicker}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #E0E0E0",
                  background: "white",
                  color: "#0A3D62",
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                }}
              >
                🗺️ Pick from map
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#718096", marginBottom: "14px" }}>
              Tip: use current location or open the map, then confirm the address above.
            </p>

            <input
              className="input-field"
              type="number"
              placeholder="Price per kg (₹) *"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />

            <input
              className="input-field"
              type="number"
              placeholder="Stock (kg) *"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            />

            <div style={{ marginBottom: "18px" }}>
              <h4
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0A3D62",
                  marginBottom: "12px",
                }}
              >
                🕐 Date & Time of Catch
              </h4>
              <input
                type="datetime-local"
                className="input-field"
                value={form.catchDateTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, catchDateTime: e.target.value }))
                }
                style={{ width: "100%" }}
              />
            </div>

            <textarea
              className="input-field"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0A3D62",
                  marginBottom: "8px",
                }}
              >
                📸 Product Image
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
            </div>

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
                marginTop: "12px",
              }}
            >
              List Fish for Sale 🐟
            </button>
          </div>
        )}

        {/* ══════════════ LISTINGS TAB ══════════════ */}
        {activeTab === "listings" && (
          <div>
            <h3 style={sectionTitle}>📋 My Listings</h3>

            {loading ? (
              <p style={{ textAlign: "center", color: "#718096" }}>
                Loading listings…
              </p>
            ) : sellerProducts.length === 0 ? (
              <div
                style={{
                  ...cardStyle,
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#718096",
                }}
              >
                <p style={{ fontSize: "48px", marginBottom: "16px" }}>🐟</p>
                <p style={{ fontWeight: 600 }}>No fish listed yet</p>
                <p style={{ fontSize: "14px" }}>Add your first fish listing</p>
                <button
                  onClick={() => setActiveTab("addFish")}
                  style={{ ...btnPrimary, marginTop: "16px" }}
                >
                  ➕ Add Fish
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                {sellerProducts.map((product) => (
                  <div key={product.id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: "16px",
                            color: "#0A3D62",
                          }}
                        >
                          {product.name}
                        </h4>
                        <p style={{ fontSize: "14px", color: "#718096" }}>
                          ₹{product.price}/kg
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: product.stock > 0 ? "#D4EDDA" : "#F8D7DA",
                          color: product.stock > 0 ? "#155724" : "#721C24",
                        }}
                      >
                        {product.stock > 0 ? "Available" : "Out of Stock"}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "#A0AEC0", marginBottom: "12px" }}>
                      Stock: {product.stock} kg
                    </p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        style={{
                          flex: 1,
                          background: "#E74C3C",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        🗑 Delete
                      </button>
                      {/* Edit button — hook up to a modal if needed */}
                      <button
                        style={{
                          flex: 1,
                          background: "#3498DB",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ORDERS TAB ══════════════ */}
        {activeTab === "orders" && (
          <div>
            <h3 style={sectionTitle}>📦 My Orders</h3>

            {loading ? (
              <p style={{ textAlign: "center", color: "#718096" }}>
                Loading orders…
              </p>
            ) : sellerOrders.length === 0 ? (
              <div
                style={{
                  ...cardStyle,
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#718096",
                }}
              >
                <p style={{ fontSize: "48px", marginBottom: "16px" }}>📦</p>
                <p style={{ fontWeight: 600 }}>No orders yet</p>
                <p style={{ fontSize: "14px" }}>
                  Orders from customers will appear here
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sellerOrders.map((order) => (
                  <div key={order.id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 700,
                            fontSize: "15px",
                            color: "#0A3D62",
                          }}
                        >
                          Order #{order.orderId || order.id.slice(-6).toUpperCase()}
                        </p>
                        <p style={{ fontSize: "13px", color: "#718096", marginTop: "4px" }}>
                          {Array.isArray(order.items)
                            ? order.items
                                .filter(
                                  (item) =>
                                    item.sellerId === auth.currentUser?.uid
                                )
                                .map(
                                  (item) =>
                                    `${item.name} (${item.quantity}kg)`
                                )
                                .join(", ")
                            : "—"}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background:
                            order.status === "Completed" ? "#D4EDDA" : "#FFF3CD",
                          color:
                            order.status === "Completed" ? "#155724" : "#856404",
                        }}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "#A0AEC0", marginBottom: "6px" }}>
                      📍 {order.address || "—"}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#2C3E50",
                        marginBottom: "12px",
                      }}
                    >
                      💰 ₹{order.total || 0}
                    </p>

                    {order.status !== "Completed" && (
                      <button
                        onClick={() => markOrderCompleted(order.id)}
                        style={{
                          ...btnPrimary,
                          padding: "8px 20px",
                          fontSize: "13px",
                        }}
                      >
                        ✅ Mark as Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0A3D62",
            color: "white",
            padding: "12px 24px",
            borderRadius: "50px",
            fontSize: "14px",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            zIndex: 999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}