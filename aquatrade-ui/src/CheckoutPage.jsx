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

  const baseTokenBookingAmount = 10;
  const availableTokens = Number(user?.tokens || 0);
  const canUseToken = availableTokens > 0;
  const payableAmount = useToken && canUseToken ? 0 : baseTokenBookingAmount;

  const placeOrder = async () => {

    if (cart.length === 0) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }

    setLoading(true);

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

      await addDoc(collection(db, "orders"), {
        ...orderData,
        total: payableAmount,
        tokenUsed: useToken && canUseToken,
      });

      if (useToken && canUseToken) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          tokens: increment(-1),
        });
        dispatch({
          type: "SET_USER",
          payload: { ...user, tokens: Math.max(availableTokens - 1, 0) },
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
                      ₹{baseTokenBookingAmount}
                    </span>
                    <span style={{ color: "#86EFAC" }}>₹0</span>
                  </>
                ) : (
                  `₹${baseTokenBookingAmount}`
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
                {useToken ? "1 token applied" : "Use Token"} · Remaining tokens: {availableTokens}
              </button>
            )}

            <button
              className="btn-primary"
              disabled={loading}
              onClick={placeOrder}
            >
              {loading ? "Processing..." : `Pay ₹${payableAmount}`}
            </button>

          </>

        )}

      </div>

    </div>

  );

}