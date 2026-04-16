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

const COLORS = {
  primary: "#2ECC71",
  accent: "#1F9D5A",
  secondary: "#F39C12",
  background: "#EAFBF0",
  textDark: "#1F2937",
  textSoft: "#6B7280",
  cardBorder: "#E5E7EB",
};

export default function SellerDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapLat, setMapLat] = useState("");
  const [mapLng, setMapLng] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    name: "",
    fishType: "",
    address: "",
    location: null,
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

  const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const parseCoordinatesFromText = (text) => {
    if (!text) return null;
    const match = text.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
    if (!match) return null;
    return { lat: Number(match[1]), lng: Number(match[3]) };
  };

  const refreshBuyerFeed = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const fishData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      dispatch({ type: "SET_FISH", payload: fishData });
    } catch (err) {
      console.error("Fish refresh error:", err);
    }
  };

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
          showToast("Location added");
        } catch (err) {
          console.error(err);
          showToast("Could not resolve address");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        showToast("Location access denied");
      }
    );
  };

  const openMapPicker = () => {
    setMapPickerOpen(true);
  };

  const applyPickedLocation = async () => {
    const lat = Number(mapLat);
    const lng = Number(mapLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      showToast("Enter valid latitude and longitude");
      return;
    }
    setGeoLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setForm((f) => ({ ...f, address, location: { lat, lng } }));
      setMapPickerOpen(false);
      showToast("Map location selected");
    } catch (err) {
      console.error(err);
      showToast("Could not fetch address for this location");
    } finally {
      setGeoLoading(false);
    }
  };

  const fetchSellerProducts = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setSellerProducts(products);
  };

  const fetchSellerOrders = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const snapshot = await getDocs(collection(db, "orders"));
    const allOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const filtered = allOrders
      .map((order) => {
        const sellerItems = (order.items || []).filter((item) => item.sellerId === currentUser.uid);
        const sellerSubtotal = sellerItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        return { ...order, sellerItems, sellerSubtotal };
      })
      .filter((order) => order.sellerItems.length > 0);

    setSellerOrders(filtered);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSellerProducts(), fetchSellerOrders()]);
    } catch (err) {
      console.error("Seller fetch error:", err);
      showToast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addFish = async () => {
    if (!form.name.trim() || !form.fishType || !form.address.trim() || !form.price || !form.stock) {
      showToast("Please fill all required fields");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Please login first");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "🐟";
      let uploadIssue = "";
      const uploadedUrls = [];
      if (imageFiles.length) {
        try {
          for (const file of imageFiles.slice(0, 5)) {
            const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${file.name}`);
            const snapshot = await withTimeout(
              uploadBytes(storageRef, file),
              25000,
              "Image upload timed out"
            );
            const url = await withTimeout(
              getDownloadURL(snapshot.ref),
              15000,
              "Image URL fetch timed out"
            );
            uploadedUrls.push(url);
          }
          imageUrl = uploadedUrls[0] || "🐟";
        } catch (uploadErr) {
          console.error("Image upload failed, continuing without image:", uploadErr);
          try {
            imageUrl = await fileToDataUrl(imageFiles[0]);
            uploadIssue = "Storage upload failed. Saved image directly with listing.";
          } catch (fileErr) {
            console.error("Data URL fallback failed:", fileErr);
            uploadIssue = "Image upload failed, listing saved without image.";
            imageUrl = "🐟";
          }
        }
      }

      const productData = {
        name: form.name.trim(),
        type: form.fishType,
        fishTypes: [form.fishType],
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        catchDateTime: form.catchDateTime,
        description: form.description.trim(),
        sellerName: state.user?.name || "Seller",
        sellerShopName: state.user?.shopName || "AquaTrade Seller",
        sellerPhone: state.user?.phoneNumber || "",
        sellerId: currentUser.uid,
        address: form.address.trim(),
        location: form.location || null,
        image: imageUrl,
        images: uploadedUrls.length ? uploadedUrls : (imageUrl !== "🐟" ? [imageUrl] : []),
        rating: 4.5,
        createdAt: serverTimestamp(),
      };

      const docRef = await withTimeout(
        addDoc(collection(db, "products"), productData),
        20000,
        "Save request timed out. Please check your internet/Firestore rules and retry."
      );
      const newFish = { id: docRef.id, ...productData };
      setSellerProducts((prev) => [newFish, ...prev]);

      setForm({
        name: "",
        fishType: "",
        address: "",
        location: null,
        category: "Fish",
        price: "",
        stock: "",
        catchDateTime: "",
        description: "",
      });
      setImageFiles([]);
      setActiveTab("listings");
      showToast(uploadIssue || "Product listed successfully");

      // Keep save fast and do background sync for buyer feed.
      refreshBuyerFeed().catch((err) => {
        console.error("Background fish refresh failed:", err);
      });
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Failed to list product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const editProduct = async (product) => {
    const newPrice = window.prompt("Update price per kg", String(product.price || ""));
    if (newPrice === null) return;
    const newStock = window.prompt("Update stock (kg)", String(product.stock || ""));
    if (newStock === null) return;

    const parsedPrice = Number(newPrice);
    const parsedStock = Number(newStock);
    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedStock)) {
      showToast("Enter valid numeric values");
      return;
    }

    try {
      await updateDoc(doc(db, "products", product.id), {
        price: parsedPrice,
        stock: parsedStock,
      });
      setSellerProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, price: parsedPrice, stock: parsedStock } : p))
      );
      await refreshBuyerFeed();
      showToast("Listing updated");
    } catch (err) {
      console.error("Edit product error:", err);
      showToast("Failed to update listing");
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
      setSellerProducts((prev) => prev.filter((p) => p.id !== productId));
      await refreshBuyerFeed();
      showToast("Listing deleted");
    } catch (err) {
      console.error("Delete product error:", err);
      showToast("Failed to delete listing");
    }
  };

  const markOrderCompleted = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "Completed" });
      setSellerOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "Completed" } : o)));
      showToast("Order marked completed");
    } catch (err) {
      console.error("Update order error:", err);
      showToast("Failed to update order");
    }
  };

  const totalRevenue = sellerOrders.filter((o) => o.status === "Completed").reduce((sum, o) => sum + (o.sellerSubtotal || 0), 0);
  const totalOrders = sellerOrders.length;
  const activeListings = sellerProducts.filter((p) => Number(p.stock || 0) > 0).length;
  const hasAnyData = totalOrders > 0 || sellerProducts.length > 0;

  const cardStyle = {
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px",
    border: `1px solid ${COLORS.cardBorder}`,
    boxShadow: "0 4px 14px rgba(15,76,117,0.06)",
  };

  return (
    <div className="app-container seller-theme" style={{ background: COLORS.background }}>
      <div
        style={{
          background: "linear-gradient(160deg, #2ECC71, #1F9D5A)",
          padding: "24px 20px 18px",
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "24px", fontWeight: 800, lineHeight: 1.1 }}>
              🐟 AquaTrade
            </h1>
            <p style={{ marginTop: "4px", opacity: 0.88, fontSize: "13px", fontWeight: 600 }}>Seller Dashboard</p>
            <p style={{ marginTop: "8px", opacity: 0.75, fontSize: "13px" }}>
              Welcome, {state.user?.shopName || state.user?.name || "Seller"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => dispatch({ type: "SET_PAGE", payload: "profile" })}
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
              Profile
            </button>
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
      </div>

      <div style={{ display: "flex", background: "white", borderBottom: `1px solid ${COLORS.cardBorder}` }}>
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "addFish", label: "Add Product" },
          { id: "listings", label: "Listings" },
          { id: "orders", label: "Orders" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "12px 6px",
              border: "none",
              background: "none",
              borderBottom: `3px solid ${activeTab === tab.id ? COLORS.accent : "transparent"}`,
              color: activeTab === tab.id ? "#166534" : COLORS.textSoft,
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="scrollable-content" style={{ padding: "14px" }}>
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={cardStyle}>Loading dashboard...</div>
            ) : !hasAnyData ? (
              <>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: "17px", color: COLORS.primary, fontWeight: 800 }}>Get started in 3 steps</h3>
                  <ol style={{ marginTop: "10px", paddingLeft: "18px", color: COLORS.textSoft, lineHeight: 1.8, fontSize: "14px" }}>
                    <li>Add your first product</li>
                    <li>Set price and stock</li>
                    <li>Start receiving orders</li>
                  </ol>
                  <button
                    onClick={() => setActiveTab("addFish")}
                    style={{
                      width: "100%",
                      marginTop: "14px",
                      background: COLORS.accent,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Add Your First Product
                  </button>
                </div>
                <div style={cardStyle}>
                  <p style={{ color: COLORS.secondary, fontWeight: 700, marginBottom: "6px" }}>Analytics Preview</p>
                  <p style={{ color: COLORS.textSoft, fontSize: "14px" }}>No recent activity yet. Start by adding your first product.</p>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div style={{ ...cardStyle, textAlign: "center", padding: "16px 10px" }}>
                    <p style={{ color: COLORS.textSoft, fontSize: "12px" }}>Revenue</p>
                    <p style={{ color: COLORS.primary, fontWeight: 900, marginTop: "6px", fontSize: "20px" }}>₹{totalRevenue}</p>
                  </div>
                  <div style={{ ...cardStyle, textAlign: "center", padding: "16px 10px" }}>
                    <p style={{ color: COLORS.textSoft, fontSize: "12px" }}>Orders</p>
                    <p style={{ color: COLORS.secondary, fontWeight: 900, marginTop: "6px", fontSize: "20px" }}>{totalOrders}</p>
                  </div>
                  <div style={{ ...cardStyle, textAlign: "center", padding: "16px 10px" }}>
                    <p style={{ color: COLORS.textSoft, fontSize: "12px" }}>Active</p>
                    <p style={{ color: COLORS.accent, fontWeight: 900, marginTop: "6px", fontSize: "20px" }}>{activeListings}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("addFish")}
                  style={{
                    width: "100%",
                    background: COLORS.accent,
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Product
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "addFish" && (
          <div style={cardStyle}>
            <h3 style={{ color: COLORS.primary, fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>List Your Product</h3>
            <input
              className="input-field"
              placeholder="Item Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />

            <select
              className="input-field"
              value={form.fishType}
              onChange={(e) => setForm((f) => ({ ...f, fishType: e.target.value }))}
              style={{ marginTop: "10px" }}
            >
              <option value="">Select category *</option>
              {fishTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              className="input-field"
              placeholder="Seller address or pickup location *"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              style={{ marginTop: "10px" }}
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              style={{
                marginTop: "10px",
                width: "100%",
                border: `1px solid ${COLORS.cardBorder}`,
                background: "white",
                borderRadius: "12px",
                padding: "12px",
                cursor: "pointer",
                color: COLORS.primary,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              📍 {geoLoading ? "Detecting location..." : "Use current location"}
            </button>
            <button
              type="button"
              onClick={openMapPicker}
              style={{
                marginTop: "10px",
                width: "100%",
                border: `1px solid ${COLORS.cardBorder}`,
                background: "#F8FAFC",
                borderRadius: "12px",
                padding: "12px",
                cursor: "pointer",
                color: COLORS.primary,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              🗺️ Pick from Map
            </button>
            {form.location && (
              <div style={{ marginTop: "10px", padding: "10px", borderRadius: "10px", background: "#F0F9FF", fontSize: "12px", color: COLORS.textSoft }}>
                📍 {form.address}
                <iframe
                  title="selected-location-preview"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.location.lng - 0.01}%2C${form.location.lat - 0.01}%2C${form.location.lng + 0.01}%2C${form.location.lat + 0.01}&layer=mapnik&marker=${form.location.lat}%2C${form.location.lng}`}
                  style={{ width: "100%", height: "120px", border: "none", borderRadius: "8px", marginTop: "8px" }}
                />
              </div>
            )}

            <input
              className="input-field"
              type="number"
              placeholder="Price per kg (₹) *"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              style={{ marginTop: "10px" }}
            />
            <input
              className="input-field"
              type="number"
              placeholder="Stock (kg) *"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              style={{ marginTop: "10px" }}
            />
            <input
              type="datetime-local"
              className="input-field"
              value={form.catchDateTime}
              onChange={(e) => setForm((f) => ({ ...f, catchDateTime: e.target.value }))}
              style={{ marginTop: "10px" }}
            />
            <textarea
              className="input-field"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ marginTop: "10px" }}
            />
            <div style={{ marginTop: "10px", marginBottom: "12px", border: `1px solid ${COLORS.cardBorder}`, borderRadius: "14px", padding: "14px", background: "#F8FAFC" }}>
              <p style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px", color: COLORS.textDark }}>Upload Images (max 5)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label
                  htmlFor="productImages"
                  style={{
                    cursor: "pointer",
                    background: "white",
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: "12px",
                    padding: "12px 10px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: COLORS.primary,
                  }}
                >
                  📁 Select images
                </label>
                <label
                  htmlFor="productCamera"
                  style={{
                    cursor: "pointer",
                    background: "white",
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: "12px",
                    padding: "12px 10px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: COLORS.primary,
                  }}
                >
                  📸 Take photo
                </label>
              </div>
              <input
                id="productImages"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 5))}
                style={{ display: "none" }}
              />
              <input
                id="productCamera"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) =>
                  setImageFiles((prev) =>
                    [...prev, ...Array.from(e.target.files || [])].slice(0, 5)
                  )
                }
                style={{ display: "none" }}
              />
            </div>
            {imageFiles.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px", overflowX: "auto" }}>
                {imageFiles.map((file) => (
                  <img
                    key={`${file.name}-${file.size}`}
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: "72px", height: "72px", borderRadius: "14px", objectFit: "cover", border: "1px solid #E5E7EB" }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={addFish}
              disabled={submitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "14px",
                padding: "13px",
                background: COLORS.accent,
                color: "white",
                fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Saving..." : "List Product for Sale"}
            </button>
          </div>
        )}

        {activeTab === "listings" && (
          <div>
            {loading ? (
              <div style={cardStyle}>Loading listings...</div>
            ) : sellerProducts.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: "36px 20px" }}>
                <p style={{ fontSize: "38px" }}>🐟</p>
                <p style={{ marginTop: "8px", color: COLORS.primary, fontWeight: 700 }}>No products listed yet</p>
                <p style={{ marginTop: "4px", color: COLORS.textSoft, fontSize: "14px" }}>Start selling by adding your first product</p>
                <button
                  onClick={() => setActiveTab("addFish")}
                  style={{
                    marginTop: "12px",
                    border: "none",
                    borderRadius: "12px",
                    background: COLORS.accent,
                    color: "white",
                    padding: "10px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sellerProducts.map((product) => (
                  <div key={product.id} style={cardStyle}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div
                        style={{
                          width: "68px",
                          height: "68px",
                          borderRadius: "12px",
                          background: "#ECFDF5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {product.image && product.image !== "🐟" ? (
                          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "30px" }}>🐟</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: COLORS.primary, fontSize: "16px", fontWeight: 800 }}>{product.name}</h4>
                        <p style={{ color: COLORS.textSoft, marginTop: "3px", fontSize: "14px" }}>₹{product.price}/kg • Stock: {product.stock} kg</p>
                        <p style={{ color: Number(product.stock) > 0 ? COLORS.accent : "#DC2626", fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>
                          {Number(product.stock) > 0 ? "Available" : "Out of stock"}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button
                        onClick={() => editProduct(product)}
                        style={{
                          flex: 1,
                          borderRadius: "10px",
                          border: "1px solid #D1D5DB",
                          background: "white",
                          padding: "9px",
                          fontWeight: 700,
                          color: COLORS.primary,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        style={{
                          flex: 1,
                          borderRadius: "10px",
                          border: "none",
                          background: "#EF4444",
                          color: "white",
                          padding: "9px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            {loading ? (
              <div style={cardStyle}>Loading orders...</div>
            ) : sellerOrders.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: "36px 20px" }}>
                <p style={{ fontSize: "38px" }}>📦</p>
                <p style={{ marginTop: "8px", color: COLORS.primary, fontWeight: 700 }}>No orders yet</p>
                <p style={{ marginTop: "4px", color: COLORS.textSoft, fontSize: "14px" }}>Orders from customers will appear here</p>
                <p style={{ marginTop: "6px", color: COLORS.secondary, fontSize: "13px", fontWeight: 600 }}>
                  Add products to start receiving orders
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sellerOrders.map((order) => (
                  <div key={order.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ color: COLORS.primary, fontWeight: 800, fontSize: "15px" }}>
                        Order #{order.orderId || order.id.slice(-6).toUpperCase()}
                      </p>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: order.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                          color: order.status === "Completed" ? "#166534" : "#92400E",
                        }}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>
                    <p style={{ marginTop: "6px", color: COLORS.textSoft, fontSize: "13px" }}>
                      Customer: {order.customerName || order.customerPhone || "Buyer"}
                    </p>
                    <p style={{ marginTop: "4px", color: COLORS.textSoft, fontSize: "13px" }}>
                      {order.sellerItems.map((item) => `${item.name} (${item.quantity}kg)`).join(", ")}
                    </p>
                    <p style={{ marginTop: "4px", color: COLORS.textSoft, fontSize: "13px" }}>Address: {order.address || "-"}</p>
                    <p style={{ marginTop: "6px", color: COLORS.secondary, fontWeight: 800 }}>
                      Seller amount: ₹{order.sellerSubtotal || 0}
                    </p>
                    {order.status !== "Completed" && (
                      <button
                        onClick={() => markOrderCompleted(order.id)}
                        style={{
                          marginTop: "10px",
                          border: "none",
                          borderRadius: "10px",
                          background: COLORS.accent,
                          color: "white",
                          padding: "9px 12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: COLORS.primary,
            color: "white",
            padding: "11px 18px",
            borderRadius: "999px",
            fontSize: "13px",
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}

      {mapPickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "420px", background: "white", borderRadius: "14px", padding: "14px" }}>
            <h3 style={{ color: COLORS.primary, marginBottom: "8px" }}>Pick from Map</h3>
            <p style={{ fontSize: "12px", color: COLORS.textSoft, marginBottom: "8px" }}>
              Open map, choose point, then paste coordinates here (lat,lng).
            </p>
            <button
              onClick={() => window.open("https://www.openstreetmap.org", "_blank")}
              style={{ width: "100%", border: "none", borderRadius: "10px", padding: "10px", background: "#E6F4FF", color: COLORS.primary, fontWeight: 700, cursor: "pointer", marginBottom: "10px" }}
            >
              Open Map
            </button>
            <input className="input-field" placeholder="Latitude" value={mapLat} onChange={(e) => setMapLat(e.target.value)} />
            <input className="input-field" placeholder="Longitude" value={mapLng} onChange={(e) => setMapLng(e.target.value)} style={{ marginTop: "8px" }} />
            <input
              className="input-field"
              placeholder="Or paste map text/url with coordinates"
              onBlur={(e) => {
                const parsed = parseCoordinatesFromText(e.target.value);
                if (parsed) {
                  setMapLat(String(parsed.lat));
                  setMapLng(String(parsed.lng));
                }
              }}
              style={{ marginTop: "8px" }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={() => setMapPickerOpen(false)}
                style={{ flex: 1, border: "1px solid #D1D5DB", borderRadius: "10px", background: "white", padding: "10px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={applyPickedLocation}
                style={{ flex: 1, border: "none", borderRadius: "10px", background: COLORS.accent, color: "white", padding: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                Use This Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
