import { useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";

/* ── Fixed booking-fee tiers ── */
function getBookingFee(total) {
  if (total < 500) return 25;
  if (total <= 1000) return 45;
  if (total <= 5000) return 75;
  return 100;
}

export default function CartPage() {

  const { state, dispatch } = useApp();
  const { cart = [], user } = state;

  /* SAFE TOTAL CALCULATIONS */

  const total = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
  const bookingFee = getBookingFee(total);

  const availableTokens = Number(user?.tokens || 0);
  const hasCoupons = availableTokens > 0;
  const grand = hasCoupons ? 0 : bookingFee;

  // Coupon progress
  const totalPurchases = Number(user?.totalPurchases || 0);
  const purchasesRemaining = 5 - (totalPurchases % 5);
  const showProgress = purchasesRemaining < 5;

  /* UPDATE QTY */

  const updateQty = (id, qty, stock) => {
    if (qty <= 0) {
      dispatch({ type: "REMOVE_FROM_CART", payload: id });
      return;
    }
    if (stock && qty > stock) {
      qty = stock;
    }
    dispatch({
      type: "UPDATE_QTY",
      payload: { id, qty },
    });
  };

  const remove = (id) => dispatch({ type: "REMOVE_FROM_CART", payload: id });

  return (

    <div className="app-container">

      {/* HEADER */}

      <div className="page-header">

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          <button
            className="back-btn"
            onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
          >
            ←
          </button>

          <h1 style={{ color: "white", fontSize: "20px", fontWeight: 800 }}>
            Your Cart 🛒
          </h1>

        </div>

        {cart.length > 0 && (
          <button
            onClick={() => dispatch({ type: "CLEAR_CART" })}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.8)",
              fontSize: "13px",
              padding: "5px 12px",
              cursor: "pointer",
              marginTop: "8px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Clear All
          </button>
        )}

      </div>

      {/* CONTENT */}

      <div className="scrollable-content" style={{ padding: "16px", paddingBottom: "100px" }}>

        {cart.length === 0 ? (

          <div style={{ textAlign: "center", padding: "80px 20px" }}>

            <div style={{ fontSize: "80px", marginBottom: "20px" }}>🛒</div>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#0A3D62",
                marginBottom: "10px",
              }}
            >
              Cart is empty
            </h2>

            <p style={{ color: "#718096", marginBottom: "24px", fontSize: "15px" }}>
              Add some fresh catch to get started!
            </p>

            <button
              className="btn-primary"
              style={{ width: "auto", padding: "12px 32px" }}
              onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
            >
              Explore Seafood 🐟
            </button>

          </div>

        ) : (

          <>

            {/* ── Coupon progress banner ── */}
            {showProgress && (
              <div className="coupon-banner">
                <span className="coupon-banner-icon">🎁</span>
                <span className="coupon-banner-text">
                  {purchasesRemaining === 0
                    ? "You earned a FREE coupon! 🎉"
                    : `Buy ${purchasesRemaining} more to earn a FREE coupon!`}
                </span>
              </div>
            )}

            {/* CART ITEMS — no product images, clean layout */}

            {cart.map((item) => (

              <div
                key={item.id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "12px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,180,216,0.1)",
                }}
              >

                {/* NAME + REMOVE */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#0A3D62",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#718096" }}>
                      {item.sellerName || "Seller"} · ₹{item.price}/kg
                    </p>
                  </div>

                  <button
                    onClick={() => remove(item.id)}
                    style={{
                      background: "#FFF0F0",
                      border: "none",
                      borderRadius: "8px",
                      width: "34px",
                      height: "34px",
                      cursor: "pointer",
                      fontSize: "15px",
                      flexShrink: 0,
                      marginLeft: "10px",
                    }}
                  >
                    🗑️
                  </button>

                </div>

                {/* PRICE + QTY */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                  <span style={{ fontWeight: 800, fontSize: "18px", color: "#0A3D62" }}>
                    ₹{(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                  </span>

                  {/* QTY CONTROL */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                    <button
                      onClick={() => updateQty(item.id, Math.max(0.25, item.qty - 0.25), item.stock)}
                      style={{
                        background: "white",
                        border: "2px solid #E2E8F0",
                        width: "36px",
                        height: "36px",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#0A3D62",
                        borderRadius: "8px",
                        fontWeight: 700,
                      }}
                    >
                      −
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0.25) {
                            updateQty(item.id, val, item.stock);
                          }
                        }}
                        style={{
                          width: "58px",
                          textAlign: "center",
                          border: "2px solid #E2E8F0",
                          borderRadius: "8px",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 800,
                          fontSize: "15px",
                          color: "#0A3D62",
                          padding: "4px",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 700 }}>kg</span>
                    </div>

                    <button
                      onClick={() => updateQty(item.id, item.qty + 0.25, item.stock)}
                      style={{
                        background: "white",
                        border: "2px solid #E2E8F0",
                        width: "36px",
                        height: "36px",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#0A3D62",
                        borderRadius: "8px",
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>

                  </div>

                </div>

              </div>

            ))}

            {/* ORDER SUMMARY */}

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >

              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0A3D62", marginBottom: "14px" }}>
                Order Summary
              </h3>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#718096" }}>Products Total</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>₹{total}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#718096" }}>
                  Booking Fee
                  <span style={{ fontSize: "12px", marginLeft: "6px", color: "#94A3B8" }}>
                    ({total < 500 ? "<₹500" : total <= 1000 ? "₹500–1000" : total <= 5000 ? "₹1000–5000" : ">₹5000"})
                  </span>
                </span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>₹{bookingFee}</span>
              </div>

              {hasCoupons && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#2ECC71", fontWeight: 600 }}>
                    🎫 Coupon Applied (1 used)
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#2ECC71" }}>
                    −₹{bookingFee}
                  </span>
                </div>
              )}

              <div
                style={{
                  borderTop: "2px solid #F0F4F8",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 800, fontSize: "16px", color: "#0A3D62" }}>
                  Token Fee
                </span>
                <span style={{ fontWeight: 900, fontSize: "22px", color: "#0A3D62" }}>
                  ₹{grand}
                </span>
              </div>

            </div>

            {/* INFO */}

            <div
              style={{
                background: "#E8F9FF",
                border: "1px solid #B3ECF7",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ fontSize: "13px", color: "#0A3D62", fontWeight: 600 }}>
                ℹ️ Booking fee reserves your slot. Fish payment is done at pickup.
              </p>
            </div>

            {/* CHECKOUT */}

            <button
              className="btn-primary"
              style={{ fontSize: "16px", padding: "16px" }}
              onClick={() => {
                const sellerPickupAddress =
                  cart.find((item) => item.address || item.sellerAddress)?.address ||
                  cart.find((item) => item.address || item.sellerAddress)?.sellerAddress ||
                  "";
                dispatch({
                  type: "SET_CHECKOUT_PICKUP_ADDRESS",
                  payload: sellerPickupAddress,
                });
                dispatch({ type: "SET_PAGE", payload: "checkout" });
              }}
            >
              Proceed to Token Booking – ₹{grand} →
            </button>

          </>

        )}

      </div>

      <BottomNav />

    </div>

  );

}