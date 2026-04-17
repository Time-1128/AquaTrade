import { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, increment } from "firebase/firestore";
import { auth, db } from "./firebase.config";
import { useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";

export default function OrdersPage() {
  const { state, dispatch } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const submitRating = async () => {
    if (!ratingOrder || !rating) return;
    try {
      await updateDoc(doc(db, "orders", ratingOrder.id), {
        rating,
        review,
        ratedAt: new Date(),
      });
      setOrders(orders.map(o => o.id === ratingOrder.id ? { ...o, rating, review } : o));
      setRatingOrder(null);
      setRating(0);
      setReview("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const openMaps = (order) => {
    if (order.location?.lat && order.location?.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.location.lat},${order.location.lng}`);
    } else if (order.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`);
    } else {
      alert("Address not available to map.");
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      const orderTime = order.createdAt?.seconds * 1000 || Date.now();
      const isWithin15Mins = (Date.now() - orderTime) <= 15 * 60 * 1000;

      await updateDoc(doc(db, "orders", order.id), {
        status: "Cancelled"
      });

      if (isWithin15Mins) {
        if (order.usedCoupon) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            tokens: increment(1)
          });
          if (state.user) {
            dispatch({ type: "SET_USER", payload: { ...state.user, tokens: (state.user.tokens || 0) + 1 } });
          }
        } else {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            walletBalance: increment((order.bookingAmount || 0))
          });
          if (state.user) {
            dispatch({ type: "SET_USER", payload: { ...state.user, walletBalance: (state.user.walletBalance || 0) + (order.bookingAmount || 0) } });
          }
        }
        alert("Order cancelled. Payment refunded.");
      } else {
        alert("Order cancelled. Payment not refundable after time limit.");
      }

      setOrders(orders.map(o => o.id === order.id ? { ...o, status: "Cancelled" } : o));

    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setOrders([]);
          return;
        }
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(ordersQuery);
        const data = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch buyer orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 style={{ fontSize: "22px", fontWeight: 800 }}>My Orders</h1>
        <p style={{ marginTop: "4px", fontSize: "14px", opacity: 0.85 }}>
          Track your bookings and pickup details
        </p>
      </div>

      <div className="scrollable-content" style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "44px" }}>📦</div>
            <h3 style={{ marginTop: "8px", color: "#0A3D62" }}>No orders yet</h3>
            <p style={{ marginTop: "6px", color: "#64748B", fontSize: "13px" }}>
              Place your first token booking to see history here.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: "14px" }}
              onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
            >
              Browse Fish Listings
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <p style={{ color: "#0A3D62", fontWeight: 800, fontSize: "16px" }}>
                      {order.orderId || order.id.slice(-6).toUpperCase()}
                    </p>
                    <p style={{ color: "#64748B", fontSize: "12px", marginTop: "2px", fontWeight: 600 }}>
                      📅 {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : order.date || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span
                    style={{
                      background: order.status === "Completed" ? "#DCFCE7" : order.status === "Cancelled" ? "#FEE2E2" : "#E0F2FE",
                      color: order.status === "Completed" ? "#166534" : order.status === "Cancelled" ? "#991B1B" : "#075985",
                      borderRadius: "999px",
                      padding: "5px 12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {order.status || "Confirmed"}
                  </span>
                </div>
                <p style={{ marginTop: "6px", fontSize: "15px", color: "#334155", fontWeight: 500 }}>
                  Items: {(order.items || []).map((item) => item.name).join(", ") || "Fish order"}
                </p>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "#334155" }}>
                  Pickup: {order.address || "Address unavailable"}
                </p>
                <p style={{ marginTop: "6px", color: "#0A3D62", fontWeight: 700, fontSize: "15px" }}>
                  Paid: {order.usedCoupon ? "1 Coupon" : `₹${order.bookingAmount || order.total || 0}`}
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => openMaps(order)}
                    style={{
                      background: "#E0F2FE", color: "#0A3D62", border: "none", borderRadius: "10px",
                      padding: "9px 14px", fontSize: "14px", fontWeight: 700, cursor: "pointer", flex: 1
                    }}
                  >
                    📍 Get Directions
                  </button>
                  <button
                    onClick={() => {
                        const phone = order.sellerPhone || order.items?.[0]?.sellerPhone;
                        if(phone) window.location.href = `tel:${phone}`;
                        else alert("Phone number not available");
                    }}
                    style={{
                      background: "#DCFCE7", color: "#065F46", border: "none", borderRadius: "10px",
                      padding: "9px 14px", fontSize: "14px", fontWeight: 700, cursor: "pointer", flex: 1
                    }}
                  >
                    📞 Call Seller
                  </button>
                  {order.status !== "Completed" && order.status !== "Cancelled" && (
                    <button
                      onClick={() => cancelOrder(order)}
                      style={{
                        background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA",
                        borderRadius: "10px", padding: "9px 14px", fontSize: "14px", fontWeight: 700,
                        cursor: "pointer", flex: 1
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
                {order.status === "Completed" && !order.rating && (
                  <button
                    onClick={() => setRatingOrder(order)}
                    style={{
                      marginTop: "10px",
                      background: "#2ECC71",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "9px 14px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Rate Seller ⭐
                  </button>
                )}
                {order.rating && (
                  <p style={{ marginTop: "6px", fontSize: "14px", color: "#2ECC71", fontWeight: 600 }}>
                    Rated: {"⭐".repeat(order.rating)} {order.rating}/5
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {ratingOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setRatingOrder(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "300px",
              width: "90%"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ textAlign: "center", color: "#0A3D62" }}>Rate Your Experience</h3>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "16px 0" }}>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: "24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: star <= rating ? "#FFD700" : "#E0E0E0"
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              style={{
                width: "100%",
                height: "60px",
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "14px",
                marginBottom: "16px"
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setRatingOrder(null)}
                style={{
                  flex: 1,
                  background: "#E0E0E0",
                  color: "#333",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={!rating}
                style={{
                  flex: 1,
                  background: rating ? "#2ECC71" : "#E0E0E0",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  cursor: rating ? "pointer" : "not-allowed"
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
