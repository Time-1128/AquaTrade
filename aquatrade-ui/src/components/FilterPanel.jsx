import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function FilterPanel({ onClose }) {
  const { state, dispatch } = useApp();
  const { filters } = state;

  const [local, setLocal] = useState({ ...filters });
  const [expandedSections, setExpandedSections] = useState({
    fishType: false,
    sort: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const apply = () => {
    dispatch({ type: "SET_FILTERS", payload: local });
    onClose();
  };

  const fishTypeOptions = [
    { id: "All", label: "All" },
    { id: "Freshwater", label: "🌊 Freshwater" },
    { id: "Saltwater", label: "🌴 Saltwater" },
    { id: "Shellfish", label: "🦪 Shellfish" },
    { id: "Exotic", label: "✨ Exotic" },
  ];

  const reset = () => {
    const def = {
      type: "All",
      category: "All",
      fishType: "All",
      priceRange: [0, 3000],
      minRating: 0,
      sortBy: "none",
      maxDistance: 10,
      maxEta: 60,
      discount: false,
    };

    setLocal(def);
    dispatch({ type: "SET_FILTERS", payload: def });
    onClose();
  };

  const sortOptions = [
    { id: "none", label: "Default" },
    { id: "priceLowHigh", label: "Price: Low → High" },
    { id: "priceHighLow", label: "Price: High → Low" },
    { id: "ratingHighLow", label: "⭐ Top Rated" },
  ];

  const SectionHeader = ({ title, section }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        background: "white",
        border: "1px solid #E0E0E0",
        borderRadius: "12px",
        cursor: "pointer",
        marginBottom: expandedSections[section] ? "10px" : "12px",
        fontWeight: 700,
        color: "#0A3D62",
        fontSize: "13px",
      }}
    >
      {title}
      <span style={{ fontSize: "16px", transition: "transform 0.2s" }}>
        {expandedSections[section] ? "▼" : "▶"}
      </span>
    </button>
  );

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
          maxHeight: "80vh",
          overflowY: "auto",
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
              fontSize: "12px",
            }}
          >
            Reset
          </button>
        </div>

        {/* FISH TYPE SECTION */}
        <div style={{ marginBottom: "16px" }}>
          <SectionHeader title="🧭 Fish Type" section="fishType" />
          {expandedSections.fishType && (
            <div style={{ display: "grid", gap: "8px" }}>
              {fishTypeOptions.map((option) => {
                const selected = local.fishType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...prev, fishType: option.id }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: selected ? "2px solid #2ECC71" : "1px solid #E0E0E0",
                      background: selected ? "rgba(46, 204, 113, 0.12)" : "white",
                      color: "#0A3D62",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SORT SECTION */}
        <div style={{ marginBottom: "16px" }}>
          <SectionHeader title="📊 Sort By" section="sort" />
          {expandedSections.sort && (
            <div style={{ display: "grid", gap: "8px" }}>
              {sortOptions.map((option) => {
                const selected = local.sortBy === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLocal((prev) => ({ ...prev, sortBy: option.id }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: selected ? "2px solid #2ECC71" : "1px solid #E0E0E0",
                      background: selected ? "rgba(46, 204, 113, 0.12)" : "white",
                      color: "#0A3D62",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={apply} style={{ marginTop: "20px" }}>
          Apply Filters ✓
        </button>
      </div>
    </div>
  );
}