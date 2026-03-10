import { useApp } from "../context/AppContext";

export default function BottomNav() {
  const { state, dispatch } = useApp();
  const { currentPage, cart } = state;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const items = [
    { icon: "🏠", label: "Home", page: "home" },
    { icon: "🔍", label: "Explore", page: "explore" },
    { icon: "🛒", label: "Cart", page: "cart", badge: cartCount },
    { icon: "👤", label: "Profile", page: "profile" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.page}
          className={`nav-item ${currentPage === item.page ? "active" : ""}`}
          onClick={() => dispatch({ type: "SET_PAGE", payload: item.page === "explore" ? "home" : item.page })}
          style={{ position: "relative" }}
        >
          <span>{item.icon}</span>
          {item.badge > 0 && (
            <span style={{
              position: "absolute", top: "0px", right: "6px",
              background: "#FF6B6B", color: "white", borderRadius: "50%",
              width: "18px", height: "18px", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: 800
            }}>{item.badge}</span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
