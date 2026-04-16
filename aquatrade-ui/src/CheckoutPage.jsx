import { useEffect, useMemo, useState } from "react";
import { useApp } from "./context/AppContext";
import { db, auth } from "./firebase.config";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

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
  const [payMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [useToken, setUseToken] = useState(false);

  useEffect(() => {
    setAddress(sellerAddressFromCart);
  }, [sellerAddressFromCart]);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const bookingFee = Math.round(total * 0.05);
  const availableTokens = Number(user?.tokens || 0);
  const walletBalance = user?.walletBalance !== undefined ? Number(user.walletBalance) : 500;
  const canUseToken = availableTokens > 0;
  const payableAmount = useToken && canUseToken ? 0 : bookingFee;

  const placeOrder = async () => {

    if (cart.length === 0) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }

    setLoading(true);

    if (!canUseToken || !useToken) {
      if (walletBalance < bookingFee) {
        alert("Not enough balance or coupons to complete token booking.");
        setLoading(false);
        return;
      }
    }

    try {
      const currentUser = auth.currentUser;
      const orderId = "TKN" + Date.now();

      const orderData = {
        userId: currentUser?.uid || user?.uid,
        customerName: user?.name || "Buyer",
        customerPhone: user?.phoneNumber || currentUser?.phoneNumber || "",
        orderId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          seller: item.sellerName || "Direct Seller",
          sellerShopName: item.sellerShopName || "AquaTrade Seller",
          sellerId: item.sellerId || null,
        })),
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

      if (usedCoupon) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          tokens: increment(-1),
        });
        dispatch({
          type: "SET_USER",
          payload: { ...user, tokens: Math.max(availableTokens - 1, 0) },
        });
      } else {
        await updateDoc(doc(db, "users", currentUser.uid), {
          walletBalance: increment(-bookingFee),
        });
        dispatch({
          type: "SET_USER",
          payload: { ...user, walletBalance: walletBalance - bookingFee },
        });
      }

      // Reduce stock after successful order placement.
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
        address
      };

      dispatch({ type: "ADD_ORDER", payload: order });

      dispatch({ type: "CLEAR_CART" });

      // Check for coupon reward
      if (total > 2000) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          tokens: increment(1),
        });
        const currentTokens = useToken && canUseToken ? Math.max(availableTokens - 1, 0) : availableTokens;
        dispatch({
          type: "SET_USER",
          payload: { ...user, tokens: currentTokens + 1 },
        });
        alert("🎉 You earned a free coupon for your next order!");
      }

      setStep("success");

    } catch (err) {

      console.error("Order placement error:", err);
      alert("Failed to place order. " + err.message);

    }

    setLoading(false);

  };

  if (step === "success") {

    return (

      <div className="app-container"
      style={{
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        minHeight:"100vh",
        textAlign:"center"
      }}>

        <h1>🎉 Booking Confirmed</h1>

        <p>Show token at fish market counter</p>

        <button
          className="btn-primary"
          onClick={() =>
            dispatch({ type:"SET_PAGE", payload:"home" })
          }
        >
          Back to Market
        </button>

      </div>

    );

  }

  return (

    <div className="app-container">

      <div className="page-header">

        <button
          onClick={() =>
            step === "payment"
            ? setStep("address")
            : dispatch({ type:"SET_PAGE", payload:"cart" })
          }
        >
          ←
        </button>

        <h1>
          {step === "address"
            ? "Pickup Details"
            : "Token Payment"}
        </h1>

      </div>

      <div className="scrollable-content" style={{padding:"20px"}}>

        {step === "address" ? (

          <>
            <div
              style={{
                background: "#E8F9FF",
                border: "1px solid #B3ECF7",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "12px",
                color: "#0A3D62",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Pickup location auto-filled from seller listing. You can edit it before payment.
            </div>
            <textarea
              value={address}
              onChange={(e)=>setAddress(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Enter pickup location"
            />

            <button
              className="btn-primary"
              onClick={()=>setStep("payment")}
            >
              Continue
            </button>
          </>

        ) : (

          <>

            <div
              style={{
                background:"#0A3D62",
                color:"white",
                padding:"20px",
                borderRadius:"12px",
                marginBottom:"16px"
              }}
            >
              Token Payment
              <h2>
                {useToken && canUseToken ? (
                  <>
                    <span style={{ textDecoration: "line-through", opacity: 0.8, marginRight: "8px" }}>
                      ₹{bookingFee}
                    </span>
                    <span style={{ color: "#86EFAC" }}>₹{payableAmount}</span>
                  </>
                ) : (
                  `₹${payableAmount}`
                )}
              </h2>
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
                   padding: "12px",
                   marginBottom: "12px",
                   fontWeight: 700,
                   cursor: "pointer",
                 }}
               >
                 {useToken ? "1 coupon applied" : "Use Coupon"} · Remaining coupons: {availableTokens}
               </button>
            )}

            {(!canUseToken || !useToken) && (
              <div style={{ marginBottom: "16px", padding: "12px", background: "#F1F5F9", borderRadius: "12px", color: "#0A3D62", fontWeight: 700, fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
                <span>Paid from Wallet:</span>
                <span>₹{bookingFee} (bal: ₹{walletBalance})</span>
              </div>
            )}

            <button
              className="btn-primary"
              disabled={loading}
              onClick={placeOrder}
            >
              {loading ? "Processing..." : `Proceed to Booking – ₹${payableAmount}`}
            </button>

          </>

        )}

      </div>

    </div>

  );

}