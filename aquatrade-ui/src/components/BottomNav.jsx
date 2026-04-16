import { useApp } from "../context/AppContext";

export default function BottomNav() {

  const { state, dispatch } = useApp();

  const { currentPage, cart } = state;

  /* SAFE CART COUNT */

  const cartCount = Array.isArray(cart)
    ? cart.reduce((s, i) => s + Number(i.qty || 1), 0)
    : 0;

  const isSeller = state.user?.role === "seller";

  const items = isSeller
    ? [
        { icon: "🏠", label: "Dashboard", page: "seller" },
        { icon: "👤", label: "Profile", page: "profile" }
      ]
    : [
        { icon: "🏠", label: "Home", page: "home" },
        { icon: "📦", label: "Orders", page: "orders" },
        { icon: "🛒", label: "Cart", page: "cart", badge: cartCount },
        { icon: "👤", label: "Profile", page: "profile" }
      ];

  return (

    <nav className="bottom-nav">

      {items.map((item) => (

        <button
          key={item.page}
          className={`nav-item ${currentPage === item.page ? "active" : ""}`}
          onClick={() =>
            dispatch({
              type: "SET_PAGE",
              payload: item.page
            })
          }
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px"
          }}
        >

          {/* ICON */}

          <span style={{ fontSize: "28px" }}>
            {item.icon}
          </span>

          {/* CART BADGE */}

          {item.badge > 0 && (

            <span
              style={{
                position: "absolute",
                top: "0px",
                right: "6px",
                background: "#FF6B6B",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800
              }}
            >
              {item.badge}
            </span>

          )}

          {/* LABEL */}

          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            {item.label}
          </span>

        </button>

      ))}

    </nav>

  );

}