import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function FilterPanel({ onClose }) {
  const { state, dispatch } = useApp();
  const { filters } = state;

  const [local, setLocal] = useState({ ...filters });

  const apply = () => {
    dispatch({ type: "SET_FILTERS", payload: local });
    onClose();
  };

  const reset = () => {
    const def = {
      type: "All",
      category: "All",
      priceRange: [0, 3000],
      minRating: 0,
      maxDistance: 10,
      maxEta: 60,
      discount: false,
    };

    setLocal(def);
    dispatch({ type: "SET_FILTERS", payload: def });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(10,61,98,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 40px",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "20px",
            }}
          >
            ⚙️ Filters
          </h2>

          <button
            onClick={reset}
            style={{
              border: "none",
              background: "none",
              color: "#FF6B6B",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        <button className="btn-primary" onClick={apply}>
          Apply Filters ✓
        </button>
      </div>
    </div>
  );
}