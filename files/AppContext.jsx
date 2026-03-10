import { createContext, useContext, useReducer } from "react";

const AppContext = createContext(null);

const fishData = [
  {
    id: 1, name: "Atlantic Salmon", type: "Sea water", category: "Fish",
    price: 850, originalPrice: 1000, rating: 4.8, reviews: 234,
    freshness: 95, stock: 12, sellerId: 1,
    sellerName: "Rajan's Fresh Catch", sellerDist: 1.2,
    eta: "12 min", discount: 15,
    description: "Premium Atlantic Salmon, freshly caught this morning. Rich in omega-3 fatty acids with a buttery texture perfect for grilling, baking, or sushi.",
    image: "🐟", color: "#FF6B6B",
    tags: ["Top Pick", "Best Deal"],
    location: { lat: 13.0827, lng: 80.2707, address: "Marina Beach Fish Market, Chennai" }
  },
  {
    id: 2, name: "Yellowfin Tuna", type: "Sea water", category: "Fish",
    price: 1200, originalPrice: 1400, rating: 4.6, reviews: 189,
    freshness: 88, stock: 8, sellerId: 2,
    sellerName: "Deep Sea Traders", sellerDist: 2.8,
    eta: "22 min", discount: 14,
    description: "Sashimi-grade Yellowfin Tuna, deep-sea caught. Lean, firm flesh with a mild flavor. Ideal for tuna steaks, poke bowls, and sushi.",
    image: "🐠", color: "#4ECDC4",
    tags: ["Premium"],
    location: { lat: 13.0569, lng: 80.2425, address: "Kasimedu Fishing Harbour, Chennai" }
  },
  {
    id: 3, name: "Indian Mackerel", type: "Sea water", category: "Fish",
    price: 320, originalPrice: 380, rating: 4.5, reviews: 412,
    freshness: 92, stock: 25, sellerId: 3,
    sellerName: "Coastal Fisheries", sellerDist: 0.8,
    eta: "8 min", discount: 16,
    description: "Fresh Indian Mackerel (Bangda) packed with flavor. Perfect for curry, fry, or grilling. High omega-3 content and affordable nutrition.",
    image: "🐡", color: "#45B7D1",
    tags: ["Best Deal", "Nearby"],
    location: { lat: 13.0900, lng: 80.2800, address: "Royapuram Fish Market, Chennai" }
  },
  {
    id: 4, name: "Tiger Prawns", type: "Sea water", category: "Prawns",
    price: 680, originalPrice: 780, rating: 4.9, reviews: 567,
    freshness: 97, stock: 15, sellerId: 1,
    sellerName: "Rajan's Fresh Catch", sellerDist: 1.2,
    eta: "12 min", discount: 13,
    description: "Jumbo Tiger Prawns, live and fresh. Succulent, meaty with a sweet ocean flavor. Perfect for tandoor, biryani, or grilled preparations.",
    image: "🦐", color: "#F7DC6F",
    tags: ["Top Pick", "Highly Rated"],
    location: { lat: 13.0827, lng: 80.2707, address: "Marina Beach Fish Market, Chennai" }
  },
  {
    id: 5, name: "Blue Swimming Crab", type: "Sea water", category: "Crab",
    price: 920, originalPrice: 1050, rating: 4.7, reviews: 321,
    freshness: 89, stock: 6, sellerId: 4,
    sellerName: "Harbor Fresh", sellerDist: 3.5,
    eta: "28 min", discount: 12,
    description: "Live Blue Swimming Crabs, caught fresh from the bay. Delicate, sweet meat perfect for crab curry, soup, or steamed preparations.",
    image: "🦀", color: "#E74C3C",
    tags: ["Live", "Premium"],
    location: { lat: 13.0700, lng: 80.2900, address: "Ennore Harbour, Chennai" }
  },
  {
    id: 6, name: "Pomfret (Silver)", type: "Sea water", category: "Fish",
    price: 760, originalPrice: 900, rating: 4.8, reviews: 298,
    freshness: 94, stock: 10, sellerId: 2,
    sellerName: "Deep Sea Traders", sellerDist: 2.8,
    eta: "22 min", discount: 16,
    description: "Premium Silver Pomfret, the king of fish. Delicate white flesh with minimal bones. Excellent for fry, curry, or steamed with ginger.",
    image: "🐟", color: "#BDC3C7",
    tags: ["Top Pick"],
    location: { lat: 13.0569, lng: 80.2425, address: "Kasimedu Fishing Harbour, Chennai" }
  },
  {
    id: 7, name: "Rohu (Fresh Water)", type: "Fresh water", category: "Fish",
    price: 280, originalPrice: 320, rating: 4.3, reviews: 534,
    freshness: 91, stock: 30, sellerId: 5,
    sellerName: "Lake Fresh Aqua", sellerDist: 4.2,
    eta: "35 min", discount: 13,
    description: "Farm-raised Rohu from pristine freshwater ponds. Popular across India for its delicate taste. Great for Bengali-style mustard fish curry.",
    image: "🐟", color: "#27AE60",
    tags: ["Fresh Water", "Best Deal"],
    location: { lat: 13.1000, lng: 80.2600, address: "Puzhal Lake, Chennai" }
  },
  {
    id: 8, name: "Dried Sardine", type: "Sea water", category: "Dried fish",
    price: 180, originalPrice: 200, rating: 4.2, reviews: 178,
    freshness: 75, stock: 50, sellerId: 3,
    sellerName: "Coastal Fisheries", sellerDist: 0.8,
    eta: "8 min", discount: 10,
    description: "Sun-dried Sardines with traditional salt cure. Intense, concentrated flavor. Perfect for chutneys, rice accompaniments, and sambal.",
    image: "🐟", color: "#D4A017",
    tags: ["Dried"],
    location: { lat: 13.0900, lng: 80.2800, address: "Royapuram Fish Market, Chennai" }
  },
  {
    id: 9, name: "Catla (Pond Fish)", type: "Pond", category: "Fish",
    price: 240, originalPrice: 280, rating: 4.4, reviews: 267,
    freshness: 90, stock: 20, sellerId: 5,
    sellerName: "Lake Fresh Aqua", sellerDist: 4.2,
    eta: "35 min", discount: 14,
    description: "Fresh Catla from local ponds. Large, flaky white flesh with mild flavor. Excellent for pan frying, deep frying, or light curries.",
    image: "🐡", color: "#8E44AD",
    tags: ["Pond Fish"],
    location: { lat: 13.1000, lng: 80.2600, address: "Puzhal Lake, Chennai" }
  },
  {
    id: 10, name: "Live Lobster", type: "Sea water", category: "Live fish",
    price: 2400, originalPrice: 2800, rating: 4.9, reviews: 89,
    freshness: 99, stock: 4, sellerId: 4,
    sellerName: "Harbor Fresh", sellerDist: 3.5,
    eta: "28 min", discount: 14,
    description: "Live Atlantic Lobster, still active in water. The ultimate luxury seafood. Boil, grill, or steam for a restaurant-quality experience at home.",
    image: "🦞", color: "#C0392B",
    tags: ["Live", "Premium", "Top Pick"],
    location: { lat: 13.0700, lng: 80.2900, address: "Ennore Harbour, Chennai" }
  },
  {
    id: 11, name: "Squid / Calamari", type: "Sea water", category: "Fish",
    price: 420, originalPrice: 500, rating: 4.5, reviews: 203,
    freshness: 86, stock: 18, sellerId: 1,
    sellerName: "Rajan's Fresh Catch", sellerDist: 1.2,
    eta: "12 min", discount: 16,
    description: "Fresh squid rings ready for cooking. Tender when cooked right. Great for calamari fry, stuffed squid, or grilled with herbs.",
    image: "🦑", color: "#7F8C8D",
    tags: ["Versatile"],
    location: { lat: 13.0827, lng: 80.2707, address: "Marina Beach Fish Market, Chennai" }
  },
  {
    id: 12, name: "Hilsa (Ilish)", type: "Fresh water", category: "Fish",
    price: 1800, originalPrice: 2100, rating: 4.9, reviews: 156,
    freshness: 96, stock: 5, sellerId: 2,
    sellerName: "Deep Sea Traders", sellerDist: 2.8,
    eta: "22 min", discount: 14,
    description: "The prized Hilsa fish, beloved in Bengal. Extraordinarily rich, oily flesh with a distinctive flavor. Seasonal delicacy - don't miss it!",
    image: "🐠", color: "#2980B9",
    tags: ["Seasonal", "Premium", "Highly Rated"],
    location: { lat: 13.0569, lng: 80.2425, address: "Kasimedu Fishing Harbour, Chennai" }
  }
];

const initialState = {
  currentPage: "landing",
  user: null,
  selectedProduct: null,
  cart: [],
  fish: fishData,
  orders: [],
  searchQuery: "",
  filters: {
    type: "All",
    category: "All",
    priceRange: [0, 3000],
    minRating: 0,
    maxDistance: 10,
    maxEta: 60,
    discount: false,
  },
  activeTab: "All",
  sellerProducts: [],
  notifications: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_PRODUCT":
      return { ...state, selectedProduct: action.payload };
    case "ADD_TO_CART": {
      const exists = state.cart.find(i => i.id === action.payload.id);
      if (exists) {
        return { ...state, cart: state.cart.map(i => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i) };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, qty: 1 }] };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter(i => i.id !== action.payload) };
    case "UPDATE_QTY":
      return { ...state, cart: state.cart.map(i => i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i).filter(i => i.qty > 0) };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "ADD_ORDER":
      return { ...state, orders: [action.payload, ...state.orders] };
    case "ADD_SELLER_PRODUCT":
      return { ...state, fish: [action.payload, ...state.fish], sellerProducts: [action.payload, ...state.sellerProducts] };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case "RATE_PRODUCT":
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.orderId
          ? { ...o, items: o.items.map(i => i.id === action.payload.fishId ? { ...i, rated: true, rating: action.payload.rating } : i) }
          : o)
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
