import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function CheckoutPage() {
  const { state, dispatch } = useApp();
  const { cart, orders } = state;
  const [step, setStep] = useState("address"); // address | payment | success
  const [address, setAddress] = useState("12, Marina Beach Rd, Chennai - 600001");
  const [payMethod, setPayMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [tokenId] = useState(`TKN${Date.now().toString().slice(-6)}`);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = orders.length < 3 ? Math.round(total * 0.2) : 0;
  const grand = total - discount + 90;

  const paymentMethods = [
    { id: "upi", icon: "📱", label: "UPI (GPay, PhonePe)", desc: "Pay via any UPI app" },
    { id: "card", icon: "💳", label: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay" },
    { id: "cod", icon: "💵", label: "Pay at Counter", desc: "Pay when you pick up fish" },
    { id: "wallet", icon: "👜", label: "AquaWallet", desc: "₹500 cashback available" },
  ];

  const placeOrder = () => {
    setLoading(true);
    setTimeout(() => {
      const order = {
        id: tokenId, items: [...cart], total: grand,
        status: "Confirmed", date: new Date().toLocaleString(),
        address, payMethod, slot: "Today 6:00–8:00 AM"
      };
      dispatch({ type: "ADD_ORDER", payload: order });
      dispatch({ type: "CLEAR_CART" });
      setLoading(false);
      setStep("success");
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="app-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "80px", marginBottom: "24px", animation: "pulse 1s ease 3" }}>🎉</div>
        <div style={{ background: "linear-gradient(135deg, #0A3D62, #00B4D8)", borderRadius: "20px", padding: "24px", marginBottom: "24px", color: "white", width: "100%" }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", opacity: 0.7, marginBottom: "4px" }}>Your Token ID</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "4px" }}>{tokenId}</h2>
          <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>Show this at the market counter</p>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 800, color: "#0A3D62", marginBottom: "10px" }}>Booking Confirmed!</h1>
        <p style={{ color: "#718096", fontSize: "14px", lineHeight: 1.6, marginBottom: "8px" }}>Your slot has been reserved for</p>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: "#00B4D8", marginBottom: "24px" }}>📅 Today 6:00 – 8:00 AM</p>

        <div style={{ background: "#F0FFF4", border: "1px solid #C8F5E0", borderRadius: "14px", padding: "16px 20px", width: "100%", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#1A7A4C", lineHeight: 1.6 }}>
            ✅ Paid ₹{grand} token booking<br />
            🐟 Pick up your fish & pay remaining at counter<br />
            📍 Marina Beach Fish Market, Chennai
          </p>
        </div>

        {orders.length <= 3 && (
          <div style={{ background: "linear-gradient(135deg, #FF6B6B, #E74C3C)", borderRadius: "14px", padding: "14px 20px", color: "white", width: "100%", marginBottom: "20px" }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "14px" }}>🎁 Loyalty Reward Unlocked!</p>
            <p style={{ fontSize: "12px", opacity: 0.9 }}>You have {3 - orders.length} more free order discounts left</p>
          </div>
        )}

        <button className="btn-primary" onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })} style={{ width: "100%", fontSize: "16px", padding: "16px" }}>
          Back to Marketplace 🏠
        </button>
        <button style={{ background: "none", border: "none", color: "#00B4D8", marginTop: "12px", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          onClick={() => dispatch({ type: "SET_PAGE", payload: "profile" })}>
          View My Orders →
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => step === "payment" ? setStep("address") : dispatch({ type: "SET_PAGE", payload: "cart" })}
            style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>←</button>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800 }}>
            {step === "address" ? "Delivery Details" : "Token Payment"}
          </h1>
        </div>
        {/* Steps */}
        <div style={{ display: "flex", gap: "4px", marginTop: "12px" }}>
          {["address", "payment"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: "4px", background: step === s || (i === 0 && step === "payment") ? "white" : "rgba(255,255,255,0.3)", borderRadius: "2px" }} />
          ))}
        </div>
      </div>

      <div className="scrollable-content" style={{ padding: "20px 16px" }}>
        {step === "address" ? (
          <>
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62", marginBottom: "14px" }}>📍 Pickup Address</h3>
              <textarea value={address} onChange={e => setAddress(e.target.value)}
                rows={3} className="input-field"
                style={{ resize: "none", lineHeight: 1.5 }} />
              <p style={{ fontSize: "12px", color: "#A0AEC0", marginTop: "8px" }}>
                ℹ️ Fish will be ready for pickup at this market location
              </p>
            </div>

            {/* Time slot */}
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62", marginBottom: "14px" }}>⏰ Select Time Slot</h3>
              {["Today 6:00–8:00 AM", "Today 4:00–6:00 PM", "Tomorrow 6:00–8:00 AM"].map(slot => (
                <div key={slot} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", border: "2px solid rgba(0,180,216,0.15)", marginBottom: "8px", cursor: "pointer", background: slot === "Today 6:00–8:00 AM" ? "#E8F9FF" : "white" }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "14px", color: "#0A3D62" }}>{slot}</span>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: slot === "Today 6:00–8:00 AM" ? "#00B4D8" : "white", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {slot === "Today 6:00–8:00 AM" && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={() => setStep("payment")} style={{ fontSize: "16px", padding: "16px" }}>
              Continue to Payment →
            </button>
          </>
        ) : (
          <>
            {/* Order summary */}
            <div style={{ background: "linear-gradient(135deg, #0A3D62, #00B4D8)", borderRadius: "16px", padding: "18px 20px", marginBottom: "16px", color: "white" }}>
              <p style={{ fontSize: "13px", opacity: 0.7, marginBottom: "4px" }}>Token Booking Amount</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "36px", fontWeight: 800 }}>₹{grand}</p>
              <p style={{ fontSize: "12px", opacity: 0.7 }}>Includes ₹50 slot booking fee</p>
            </div>

            {/* Payment methods */}
            <div style={{ background: "white", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0A3D62", marginBottom: "14px" }}>💳 Payment Method</h3>
              {paymentMethods.map(m => (
                <div key={m.id} onClick={() => setPayMethod(m.id)} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px", borderRadius: "12px", cursor: "pointer",
                  border: `2px solid ${payMethod === m.id ? "#00B4D8" : "#E2E8F0"}`,
                  background: payMethod === m.id ? "#E8F9FF" : "white",
                  marginBottom: "8px", transition: "all 0.2s"
                }}>
                  <span style={{ fontSize: "24px" }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#0A3D62" }}>{m.label}</p>
                    <p style={{ fontSize: "11px", color: "#A0AEC0" }}>{m.desc}</p>
                  </div>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: payMethod === m.id ? "#00B4D8" : "white", border: "2px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {payMethod === m.id && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFAE0", border: "1px solid #F6C90E", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#B8860B", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                🔒 Secure demo payment – No real money charged
              </p>
            </div>

            <button className="btn-primary" onClick={placeOrder} disabled={loading} style={{ fontSize: "16px", padding: "16px" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div className="loader"><div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" /></div>
                  Processing...
                </span>
              ) : `Pay ₹${grand} & Book Token →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
