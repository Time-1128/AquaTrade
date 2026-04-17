import { useEffect, useMemo, useState } from "react";
import { useApp } from "./context/AppContext";
import { db, auth } from "./firebase.config";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

/* ── Fixed booking-fee tiers ── */
function getBookingFee(total) {
  if (total < 500) return 25;
  if (total <= 1000) return 45;
  if (total <= 5000) return 75;
  return 100;
}

/* ── Coupon progress helper ── */
function getCouponProgress(totalPurchases) {
  const completed = Number(totalPurchases || 0);
  const remaining = 5 - (completed % 5);
  if (remaining === 5 && completed > 0) return null; // just earned one, handled by success screen
  return remaining;
}

export default function CheckoutPage() {

  const { state, dispatch } = useApp();
  const { cart, user, checkoutPickupAddress } = state;

  const [step, setStep] = useState("address");
  const sellerAddressFromCart = useMemo(
    () =>
      checkoutPickupAddress ||
      cart.find((item) => item.address || item.sellerAddress)?.address ||
      cart.find((item) => item.address || item.sellerAddress)?.sellerAddress ||
      user?.address ||
      "",
    [checkoutPickupAddress, cart, user?.address]
  );

  const [address, setAddress] = useState(sellerAddressFromCart);
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phoneNumber || "");
  const [payMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [couponEarned, setCouponEarned] = useState(false);

  useEffect(() => {
    setAddress(sellerAddressFromCart);
  }, [sellerAddressFromCart]);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bookingFee = getBookingFee(total);
  const availableTokens = Number(user?.tokens || 0);
  const walletBalance = 500; // Hardcoded per user request
  const canUseToken = availableTokens > 0;
  const payableAmount = useToken && canUseToken ? 0 : bookingFee;

  // Coupon progress
  const totalPurchases = Number(user?.totalPurchases || 0);
  const purchasesRemaining = getCouponProgress(totalPurchases);

  const placeOrder = async () => {

    if (cart.length === 0) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }

    setLoading(true);

    if (!canUseToken || !useToken) {
      if (walletBalance < bookingFee) {
        alert("Not enough wallet balance or coupons to complete token booking.");
        setLoading(false);
        return;
      }
    }

    try {
      const currentUser = auth.currentUser;
      const orderId = "TKN" + Date.now();

      const orderData = {
        userId: currentUser?.uid || user?.uid,
        customerName: buyerName || user?.name || "Buyer",
        customerPhone: buyerPhone || user?.phoneNumber || currentUser?.phoneNumber || "",
        orderId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          seller: item.sellerName || "Direct Seller",
          sellerShopName: item.sellerShopName || "AquaTrade Seller",
          sellerId: item.sellerId || null,
          sellerPhone: item.sellerPhone || null,
        })),
        sellerPhone: cart.find((item) => item.sellerPhone)?.sellerPhone || "",
        total: payableAmount,
        fullTotal: total,
        status: "Confirmed",
        paymentMethod: payMethod,
        address,
        createdAt: serverTimestamp(),
      };

      const usedCoupon = useToken && canUseToken;

      await addDoc(collection(db, "orders"), {
        ...orderData,
        total: payableAmount,
        usedCoupon: usedCoupon,
        bookingAmount: usedCoupon ? 0 : bookingFee,
      });

      /* ── Deduct token or wallet ── */
      if (usedCoupon) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          tokens: increment(-1),
        });
        dispatch({
          type: "SET_USER",
          payload: { ...user, tokens: Math.max(availableTokens - 1, 0) },
        });
      } else {
        // Keeping wallet balance explicitly at 500 for testing, bypassing db update
        dispatch({
          type: "SET_USER",
          payload: { ...user, walletBalance: 500 },
        });
      }

      /* ── Reduce stock ── */
      await Promise.all(
        cart.map((item) =>
          updateDoc(doc(db, "products", item.id), {
            stock: increment(-Number(item.qty || 0)),
          })
        )
      );

      const order = {
        id: orderId,
        items: [...cart],
        total: payableAmount,
        status: "Confirmed",
        date: new Date().toLocaleString(),
        address,
      };

      dispatch({ type: "ADD_ORDER", payload: order });
      dispatch({ type: "CLEAR_CART" });

      /* ── Coupon reward: 1 per 5 purchases (deduplicated) ── */
      const prevTotal = Number(user?.totalPurchases || 0);
      const newTotal = prevTotal + 1;
      const lastRewarded = Number(user?.lastCouponAtPurchase || 0);
      const shouldReward = newTotal % 5 === 0 && newTotal !== lastRewarded;

      const tokensAfterOrder = usedCoupon
        ? Math.max(availableTokens - 1, 0)
        : availableTokens;

      const firestoreUpdate = {
        totalPurchases: newTotal,
        ...(shouldReward && {
          tokens: increment(1),
          lastCouponAtPurchase: newTotal,
        }),
      };

      await updateDoc(doc(db, "users", currentUser.uid), firestoreUpdate);

      dispatch({
        type: "SET_USER",
        payload: {
          ...user,
          tokens: shouldReward ? tokensAfterOrder + 1 : tokensAfterOrder,
          walletBalance: usedCoupon ? walletBalance : walletBalance - bookingFee,
          totalPurchases: newTotal,
          lastCouponAtPurchase: shouldReward ? newTotal : lastRewarded,
        },
      });

      setCouponEarned(shouldReward);
      setStep("success");

    } catch (err) {
      console.error("Order placement error:", err);
      alert("Failed to place order. " + err.message);
    }

    setLoading(false);
  };

  /* ── Success screen ── */
  if (step === "success") {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "24px",
          background: "#F5F7FA",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F4C75", marginBottom: "8px" }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: "#6B7280", fontSize: "15px", marginBottom: "20px" }}>
          Show token to seller at pickup
        </p>

        <div style={{ background: "white", padding: "16px", borderRadius: "12px", marginBottom: "20px", width: "100%", maxWidth: "340px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "left", border: "1px solid #E2E8F0" }}>
            <h3 style={{ color: "#0F4C75", fontSize: "16px", marginBottom: "10px", fontWeight: 800 }}>Seller Details Unlocked 🔓</h3>
            <p style={{ color: "#334155", fontSize: "14px", marginBottom: "6px" }}>
              <strong>📞 Phone:</strong> {cart.find((item) => item.sellerPhone)?.sellerPhone || "Not Provided"}
            </p>
            <p style={{ color: "#334155", fontSize: "14px", lineHeight: 1.4 }}>
              <strong>📍 Pickup Address:</strong> {address || "Not Provided"}
            </p>
        </div>

        {couponEarned && (
          <div
            style={{
              background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
              border: "1.5px solid #6EE7B7",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "20px",
              width: "100%",
              maxWidth: "340px",
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "6px" }}>🎁</p>
            <p style={{ fontWeight: 800, color: "#065F46", fontSize: "16px" }}>
              You earned a FREE coupon!
            </p>
            <p style={{ color: "#059669", fontSize: "14px", marginTop: "4px" }}>
              Every 5 purchases = 1 free coupon. Keep going!
            </p>
          </div>
        )}

        {!couponEarned && (() => {
          const newTotal = Number(user?.totalPurchases || 0);
          const rem = 5 - (newTotal % 5);
          return rem < 5 ? (
            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "20px",
                width: "100%",
                maxWidth: "340px",
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1D4ED8" }}>
                🎁 Buy {rem} more to earn a FREE coupon!
              </p>
            </div>
          ) : null;
        })()}

        <button
          className="btn-primary"
          style={{ maxWidth: "320px" }}
          onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
        >
          Back to Market
        </button>
      </div>
    );
  }

  return (

    <div className="app-container">

      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="back-btn"
          onClick={() =>
            step === "payment"
              ? setStep("address")
              : dispatch({ type: "SET_PAGE", payload: "cart" })
          }
        >
          ←
        </button>
        <h1 style={{ color: "white", fontSize: "20px", fontWeight: 800 }}>
          {step === "address" ? "Your Details" : "Token Payment"}
        </h1>
      </div>

      <div className="scrollable-content" style={{ padding: "20px" }}>

        {/* ── Coupon progress banner ── */}
        {purchasesRemaining !== null && purchasesRemaining < 5 && (
          <div className="coupon-banner">
            <span className="coupon-banner-icon">🎁</span>
            <span className="coupon-banner-text">
              Buy {purchasesRemaining} more to earn a FREE coupon!
            </span>
          </div>
        )}

        {step === "address" ? (

          <>
            <div
              style={{
                background: "#E8F9FF",
                border: "1px solid #B3ECF7",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "16px",
                color: "#0A3D62",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              🔒 Exact pickup location and seller phone number will be revealed after booking.
            </div>

            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4A5568", fontWeight: 700 }}>Your Name</label>
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="input-field"
              placeholder="Enter your name"
              style={{ marginBottom: "16px" }}
            />

            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4A5568", fontWeight: 700 }}>Your Phone Number</label>
            <input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="input-field"
              placeholder="Enter your phone number"
            />

            <button
              className="btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => setStep("payment")}
            >
              Continue
            </button>
          </>

        ) : (

          <>
            {/* ── Payment summary card ── */}
            <div
              style={{
                background: "#0A3D62",
                color: "white",
                padding: "20px",
                borderRadius: "14px",
                marginBottom: "16px",
              }}
            >
              <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "6px" }}>Token Payment</p>
              <h2 style={{ fontSize: "28px", fontWeight: 900 }}>
                {useToken && canUseToken ? (
                  <>
                    <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: "10px", fontSize: "20px" }}>
                      ₹{bookingFee}
                    </span>
                    <span style={{ color: "#86EFAC" }}>₹0</span>
                  </>
                ) : (
                  `₹${payableAmount}`
                )}
              </h2>
              <p style={{ fontSize: "13px", opacity: 0.7, marginTop: "6px" }}>
                Order total: ₹{total} · Booking fee tier:{" "}
                {total < 500 ? "<₹500 → ₹25" : total <= 1000 ? "₹500–1000 → ₹45" : total <= 5000 ? "₹1000–5000 → ₹75" : ">₹5000 → ₹100"}
              </p>
            </div>

            {canUseToken && (
              <button
                type="button"
                onClick={() => setUseToken((prev) => !prev)}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: useToken ? "2px solid #2ECC71" : "1px solid #D1D5DB",
                  background: useToken ? "#ECFDF5" : "white",
                  color: "#0A3D62",
                  padding: "14px",
                  marginBottom: "12px",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{useToken ? "✅ 1 Coupon Applied" : "🎫 Use Coupon"}</span>
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  {availableTokens} available
                </span>
              </button>
            )}

            {!canUseToken && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#F8FAFC",
                  borderRadius: "12px",
                  color: "#64748B",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid #E2E8F0",
                }}
              >
                No coupons yet — earn 1 for every 5 purchases 🎁
              </div>
            )}

            {(!canUseToken || !useToken) && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  background: "#F1F5F9",
                  borderRadius: "12px",
                  color: "#0A3D62",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Paid from Wallet:</span>
                <span>₹{bookingFee} (bal: ₹{walletBalance})</span>
              </div>
            )}

            <button
              className="btn-primary"
              disabled={loading}
              onClick={placeOrder}
            >
              {loading ? "Processing..." : `Confirm Booking – ₹${payableAmount}`}
            </button>

          </>

        )}

      </div>

    </div>

  );

}