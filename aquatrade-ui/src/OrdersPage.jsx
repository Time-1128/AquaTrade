import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase.config";
import { useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";

export default function OrdersPage() {
  const { dispatch } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <p style={{ marginTop: "4px", fontSize: "12px", opacity: 0.8 }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <p style={{ color: "#0A3D62", fontWeight: 800 }}>
                    {order.orderId || order.id.slice(-6).toUpperCase()}
                  </p>
                  <span
                    style={{
                      background: order.status === "Completed" ? "#DCFCE7" : "#E0F2FE",
                      color: order.status === "Completed" ? "#166534" : "#075985",
                      borderRadius: "999px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {order.status || "Confirmed"}
                  </span>
                </div>
                <p style={{ marginTop: "6px", fontSize: "13px", color: "#334155" }}>
                  Items: {(order.items || []).map((item) => item.name).join(", ") || "Fish order"}
                </p>
                <p style={{ marginTop: "4px", fontSize: "13px", color: "#334155" }}>
                  Pickup: {order.address || "Address unavailable"}
                </p>
                <p style={{ marginTop: "6px", color: "#0A3D62", fontWeight: 700 }}>
                  Token Paid: ₹{order.total || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
