import { useState } from "react";
import { useApp } from "./context/AppContext";

export default function CheckoutPage() {

  const { state, dispatch } = useApp();
  const { cart, orders, user } = state;

  const [step, setStep] = useState("address");
  const [address, setAddress] = useState("12, Marina Beach Rd, Chennai");
  const [payMethod, setPayMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  /* TOKEN ONLY PAYMENT (10%) */

  const tokenAmount = Math.round(total * 0.1);

  const placeOrder = async () => {

    if (cart.length === 0) {
      dispatch({ type: "SET_PAGE", payload: "home" });
      return;
    }

    setLoading(true);

    try {

      for (let item of cart) {

        await fetch("http://localhost:5000/api/orders/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user?.id || 1,
            fish_id: item.id,
            quantity: item.qty,
            pickup_time: "Today Evening"
          })
        });

      }

      const order = {
        id: "TKN" + Date.now(),
        items: [...cart],
        total: tokenAmount,
        status: "Confirmed",
        date: new Date().toLocaleString(),
        address
      };

      dispatch({ type: "ADD_ORDER", payload: order });

      dispatch({ type: "CLEAR_CART" });

      setStep("success");

    } catch (err) {

      console.error(err);

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
            <textarea
              value={address}
              onChange={(e)=>setAddress(e.target.value)}
              rows={3}
              className="input-field"
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
              <h2>₹{tokenAmount}</h2>
            </div>

            <button
              className="btn-primary"
              disabled={loading}
              onClick={placeOrder}
            >
              {loading ? "Processing..." : `Pay ₹${tokenAmount}`}
            </button>

          </>

        )}

      </div>

    </div>

  );

}