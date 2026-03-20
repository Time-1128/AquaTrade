import { createContext, useContext, useReducer } from "react";

const AppContext = createContext();

const initialState = {
currentPage: "landing",
user: null,
cart: [],
orders: [],
selectedProduct: null,
sellerProducts: [],
searchQuery: "",
activeTab: "All",

filters: {
type: "All",
category: "All",
priceRange: [0, 3000],
minRating: 0,
maxDistance: 10,
maxEta: 60,
discount: false,
},

fish: []
};

function reducer(state, action) {

switch (action.type) {

case "SET_PAGE":
  return { ...state, currentPage: action.payload };

case "SET_USER":
  return { ...state, user: action.payload };

case "SET_SEARCH":
  return { ...state, searchQuery: action.payload };

case "SET_TAB":
  return { ...state, activeTab: action.payload };

case "SET_FILTERS":
  return { ...state, filters: { ...state.filters, ...action.payload } };

case "SET_FISH":
  return {
    ...state,
    fish: action.payload
  };

case "SELECT_PRODUCT":
  return {
    ...state,
    selectedProduct: action.payload,
    currentPage: "product",
  };

case "ADD_TO_CART": {

  const existing = state.cart.find((i) => i.id === action.payload.id);

  if (existing) {

    if (existing.qty >= action.payload.stock) {
      return state;
    }

    return {
      ...state,
      cart: state.cart.map((i) =>
        i.id === action.payload.id
          ? { ...i, qty: i.qty + 1 }
          : i
      ),
    };
  }

  return {
    ...state,
    cart: [...state.cart, { ...action.payload, qty: 1 }],
  };

}

case "UPDATE_QTY":
  return {
    ...state,
    cart: state.cart.map((i) =>
      i.id === action.payload.id
        ? { ...i, qty: Math.max(1, action.payload.qty) }
        : i
    ),
  };

case "REMOVE_FROM_CART":
  return {
    ...state,
    cart: state.cart.filter((i) => i.id !== action.payload),
  };

case "CLEAR_CART":
  return { ...state, cart: [] };

case "ADD_ORDER":
  return { ...state, orders: [...state.orders, action.payload] };

case "ADD_SELLER_PRODUCT":
  return {
    ...state,
    sellerProducts: [...state.sellerProducts, action.payload],
  };

default:
  return state;

}
}

export function AppProvider({ children }) {

const [state, dispatch] = useReducer(reducer, initialState);

return (
<AppContext.Provider value={{ state, dispatch }}>
{children}
</AppContext.Provider>
);

}

export function useApp() {
return useContext(AppContext);
}