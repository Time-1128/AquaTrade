import { useApp } from "../context/AppContext";

export default function BottomNav() {

  const { state, dispatch } = useApp();

  const { currentPage, cart } = state;

  /* SAFE CART COUNT */

  const cartCount = Array.isArray(cart)
    ? cart.reduce((s, i) => s + Number(i.qty || 1), 0)
    : 0;

  const items = [

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

          <span style={{ fontSize: "20px" }}>
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

          <span style={{ fontSize: "11px" }}>
            {item.label}
          </span>

        </button>

      ))}

    </nav>

  );

}