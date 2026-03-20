import { useApp } from "./context/AppContext";
import BottomNav from "./components/BottomNav";

export default function CartPage() {

  const { state, dispatch } = useApp();

  const { cart = [], orders = [] } = state;

  /* SAFE TOTAL CALCULATIONS */

  const total = cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);

  const deliveryFee = total > 500 ? 0 : 40;

  const bookingFee = Math.round(total * 0.1);

  const orderCount = Array.isArray(orders) ? orders.length : 0;

  const discount = orderCount < 3 ? Math.round(total * 0.2) : 0;

  const grand = Math.max(total - discount + deliveryFee + bookingFee, 0);

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
      payload: { id, qty }
    });

  };

  const remove = (id) => dispatch({ type: "REMOVE_FROM_CART", payload: id });

  return (

    <div className="app-container">

      {/* HEADER */}

      <div className="page-header">

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          <button
            onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            ←
          </button>

          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "20px",
              fontWeight: 800
            }}
          >
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
              fontSize: "12px",
              padding: "4px 10px",
              cursor: "pointer",
              marginTop: "8px",
              fontFamily: "'Syne', sans-serif"
            }}
          >
            Clear All
          </button>

        )}

      </div>

      {/* CONTENT */}

      <div className="scrollable-content" style={{ padding: "16px" }}>

        {cart.length === 0 ? (

          <div style={{ textAlign: "center", padding: "80px 20px" }}>

            <div style={{ fontSize: "80px", marginBottom: "20px" }}>🛒</div>

            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "22px",
                fontWeight: 800,
                color: "#0A3D62",
                marginBottom: "10px"
              }}
            >
              Cart is empty
            </h2>

            <p style={{ color: "#718096", marginBottom: "24px" }}>
              Add some fresh catch to get started!
            </p>

            <button
              className="btn-primary"
              style={{ width: "auto", padding: "12px 32px" }}
              onClick={() =>
                dispatch({ type: "SET_PAGE", payload: "home" })
              }
            >
              Explore Seafood 🐟
            </button>

          </div>

        ) : (

          <>

            {/* CART ITEMS */}

            {cart.map((item) => {

              /* FIXED IMAGE LOGIC */

              let imageUrl = null;

              if (item.image && item.image !== "🐟") {

                if (item.image.startsWith("http")) {
                  imageUrl = item.image;
                } else {
                  imageUrl = `http://localhost:5000/${item.image}`;
                }

              }

              return (

                <div
                  key={item.id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    border: "1px solid rgba(0,180,216,0.1)"
                  }}
                >

                  {/* IMAGE */}

                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      background: `${item.color || "#00B4D8"}20`,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      flexShrink: 0
                    }}
                  >

                    {imageUrl ? (

                      <img
                        src={imageUrl}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "10px"
                        }}
                      />

                    ) : (

                      item.image || "🐟"

                    )}

                  </div>

                  {/* INFO */}

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0A3D62",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.name}
                    </h3>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "#718096",
                        marginBottom: "6px"
                      }}
                    >
                      {item.sellerName}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >

                      <span
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 800,
                          fontSize: "16px",
                          color: "#0A3D62"
                        }}
                      >
                        ₹{Number(item.price || 0) * Number(item.qty || 0)}
                      </span>

                      {/* QTY CONTROL */}

                      <div
                        style={{
                          display: "flex",
                          border: "2px solid #E2E8F0",
                          borderRadius: "10px",
                          overflow: "hidden"
                        }}
                      >

                        <button
                          onClick={() =>
                            updateQty(item.id, item.qty - 1, item.stock)
                          }
                          style={{
                            background: "white",
                            border: "none",
                            width: "32px",
                            height: "32px",
                            fontSize: "16px",
                            cursor: "pointer",
                            color: "#0A3D62"
                          }}
                        >
                          −
                        </button>

                        <span
                          style={{
                            width: "28px",
                            textAlign: "center",
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 800,
                            fontSize: "14px",
                            color: "#0A3D62"
                          }}
                        >
                          {item.qty}
                        </span>

                        <button
                          onClick={() =>
                            updateQty(item.id, item.qty + 1, item.stock)
                          }
                          style={{
                            background: "white",
                            border: "none",
                            width: "32px",
                            height: "32px",
                            fontSize: "16px",
                            cursor: "pointer",
                            color: "#0A3D62"
                          }}
                        >
                          +
                        </button>

                      </div>

                    </div>

                  </div>

                  {/* REMOVE */}

                  <button
                    onClick={() => remove(item.id)}
                    style={{
                      background: "#FFF0F0",
                      border: "none",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                      fontSize: "14px",
                      flexShrink: 0
                    }}
                  >
                    🗑️
                  </button>

                </div>

              );

            })}

            {/* ORDER SUMMARY */}

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
              }}
            >

              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0A3D62",
                  marginBottom: "14px"
                }}
              >
                Order Summary
              </h3>

              {[

                { label: "Subtotal", value: `₹${total}` },

                {
                  label: "Delivery fee",
                  value: deliveryFee === 0 ? "FREE 🎉" : `₹${deliveryFee}`
                },

                { label: "Token booking fee", value: `₹${bookingFee}` },

                ...(discount > 0
                  ? [
                      {
                        label: "🎁 First order discount",
                        value: `-₹${discount}`,
                        highlight: true
                      }
                    ]
                  : [])

              ].map((row) => (

                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px"
                  }}
                >

                  <span
                    style={{
                      fontSize: "14px",
                      color: row.highlight ? "#2ECC71" : "#718096"
                    }}
                  >
                    {row.label}
                  </span>

                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: row.highlight ? "#2ECC71" : "#0A3D62"
                    }}
                  >
                    {row.value}
                  </span>

                </div>

              ))}

              <div
                style={{
                  borderTop: "2px solid #F0F4F8",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >

                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "16px",
                    color: "#0A3D62"
                  }}
                >
                  Total
                </span>

                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "20px",
                    color: "#0A3D62"
                  }}
                >
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
                marginBottom: "16px"
              }}
            >

              <p
                style={{
                  fontSize: "12px",
                  color: "#0A3D62",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600
                }}
              >
                ℹ️ Payment is for token/slot booking only. Fish payment is done at pickup.
              </p>

            </div>

            {/* CHECKOUT */}

            <button
              className="btn-primary"
              style={{ fontSize: "16px", padding: "16px" }}
              onClick={() =>
                dispatch({ type: "SET_PAGE", payload: "checkout" })
              }
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