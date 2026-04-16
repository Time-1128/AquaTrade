import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

const defaultFilters = {
  fishTypes: [],
  sortBy: "",
  priceRanges: [],
  discounts: [],
  ratings: [],
  distanceRanges: [],
  freshnessRanges: [],
};

const filterCategories = [
  {
    id: "fishTypes",
    label: "Category",
    icon: "🐠",
    multi: true,
    options: [
      { id: "Sea", label: "Sea" },
      { id: "Freshwater", label: "Freshwater" },
      { id: "Canal/Lake", label: "Canal/Lake" },
    ],
  },
  {
    id: "freshnessRanges",
    label: "Freshness",
    icon: "🕒",
    multi: true,
    options: [
      { id: "within2h", label: "Within 2 hours" },
      { id: "within6h", label: "Within 6 hours" },
      { id: "within12h", label: "Within 12 hours" },
      { id: "within24h", label: "Within 24 hours" },
      { id: "more1d", label: "More than 1 day" },
    ],
  },
  {
    id: "sortBy",
    label: "Sort By",
    icon: "↕️",
    multi: false,
    options: [
      { id: "priceLowHigh", label: "Price Low to High" },
      { id: "priceHighLow", label: "Price High to Low" },
      { id: "nearestFirst", label: "Nearest First" },
    ],
  },
  {
    id: "priceRanges",
    label: "Price Range",
    icon: "💰",
    multi: true,
    options: [
      { id: "lt1000", label: "< ₹1000" },
      { id: "1000-2000", label: "₹1000–₹2000" },
      { id: "2000-5000", label: "₹2000–₹5000" },
      { id: "5000-10000", label: "₹5000–₹10000" },
      { id: "gt10000", label: "> ₹10000" },
    ],
  },
  {
    id: "discounts",
    label: "Discount",
    icon: "🏷️",
    multi: true,
    options: [
      { id: "upto5", label: "Up to 5%" },
      { id: "upto15", label: "Up to 15%" },
      { id: "upto20", label: "Up to 20%" },
      { id: "upto30", label: "Up to 30%" },
      { id: "gt30", label: "More than 30%" },
    ],
  },
  {
    id: "ratings",
    label: "Rating",
    icon: "⭐",
    multi: true,
    options: [
      { id: 1, label: "1★ & above" },
      { id: 2, label: "2★ & above" },
      { id: 3, label: "3★ & above" },
      { id: 4, label: "4★ & above" },
      { id: 5, label: "5★" },
    ],
  },
  {
    id: "distanceRanges",
    label: "Distance",
    icon: "📍",
    multi: true,
    options: [
      { id: "within1", label: "Within 1 km" },
      { id: "within5", label: "Within 5 km" },
      { id: "within10", label: "Within 10 km" },
      { id: "within20", label: "Within 20 km" },
      { id: "more20", label: "More than 20 km" },
    ],
  },
];

export default function FilterPanel({ onClose }) {
  const { state, dispatch } = useApp();
  const [local, setLocal] = useState({ ...defaultFilters, ...state.filters });
  const [activeCategory, setActiveCategory] = useState("fishTypes");
  const [isClosing, setIsClosing] = useState(false);

  const selectedCountByCategory = useMemo(
    () =>
      filterCategories.reduce((acc, category) => {
        const value = local[category.id];
        acc[category.id] = Array.isArray(value) ? value.length : value ? 1 : 0;
        return acc;
      }, {}),
    [local]
  );

  const activeCategoryConfig = filterCategories.find((item) => item.id === activeCategory);

  const toggleOption = (category, optionId) => {
    setLocal((prev) => {
      if (!category.multi) return { ...prev, [category.id]: optionId };

      const current = prev[category.id] || [];
      const exists = current.includes(optionId);
      return {
        ...prev,
        [category.id]: exists ? current.filter((value) => value !== optionId) : [...current, optionId],
      };
    });
  };

  const isSelected = (category, optionId) => {
    const value = local[category.id];
    return category.multi ? (value || []).includes(optionId) : value === optionId;
  };

  const apply = () => {
    dispatch({ type: "SET_FILTERS", payload: local });
    setIsClosing(true);
  };

  const clearAll = () => {
    setLocal(defaultFilters);
    dispatch({ type: "SET_FILTERS", payload: defaultFilters });
  };

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      onClose();
    }, 300);
    return () => clearTimeout(timer);
  }, [isClosing, onClose]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") setIsClosing(true);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div
      className={`filter-overlay ${isClosing ? "closing" : ""}`}
      onClick={() => setIsClosing(true)}
    >
      <aside
        className={`filter-panel ${isClosing ? "closing" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="filter-header">
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0A3D62" }}>Filters</h2>
          <button className="filter-close-btn" onClick={() => setIsClosing(true)}>
            ✕
          </button>
        </div>

        <div className="filter-body">
          <div className="filter-categories">
            {filterCategories.map((category) => {
              const active = activeCategory === category.id;
              const count = selectedCountByCategory[category.id];
              return (
                <button
                  key={category.id}
                  className={`filter-category-btn ${active ? "active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span className="filter-category-label">
                    {category.icon} {category.label}
                  </span>
                  {count > 0 && <span className="filter-count-chip">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="filter-options">
            <p style={{ color: "#0A3D62", fontWeight: 700, marginBottom: "12px" }}>
              {activeCategoryConfig?.icon} {activeCategoryConfig?.label}
            </p>
            <div style={{ display: "grid", gap: "10px" }}>
              {activeCategoryConfig?.options.map((option) => {
                const selected = isSelected(activeCategoryConfig, option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(activeCategoryConfig, option.id)}
                    className={`filter-option-btn ${selected ? "selected" : ""}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button className="btn-secondary filter-btn" onClick={clearAll}>
            Clear All
          </button>
          <button className="btn-primary filter-btn" onClick={apply}>
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}