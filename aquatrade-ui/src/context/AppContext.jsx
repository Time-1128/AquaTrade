import { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { auth, db } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
  askProfileSetup: false,
  filters: {
    fishTypes: [],
    sortBy: "",
    priceRanges: [],
    discounts: [],
    ratings: [],
    distanceRanges: [],
  },
  fish: [],
  checkoutPickupAddress: "",
};

function reducer(state, action) {
  switch (action.type) {

    case "SET_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_USER":
      return { ...state, user: action.payload };

    case "LOGOUT":
      localStorage.removeItem("userRole");
      return { ...initialState, currentPage: "login", askProfileSetup: false };

    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };

    case "SET_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "SET_CHECKOUT_PICKUP_ADDRESS":
      return { ...state, checkoutPickupAddress: action.payload || "" };

    case "SET_ASK_PROFILE_SETUP":
      return { ...state, askProfileSetup: action.payload };

    case "SET_FISH":
      return { ...state, fish: action.payload };

    case "SELECT_PRODUCT":
      return { ...state, selectedProduct: action.payload, currentPage: "product" };

    case "ADD_TO_CART": {
      const existing = state.cart.find((i) => i.id === action.payload.id);
      if (existing) {
        if (existing.qty >= action.payload.stock) return state;
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...action.payload, qty: 1 }] };
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
      return { ...state, cart: state.cart.filter((i) => i.id !== action.payload) };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };

    case "ADD_SELLER_PRODUCT":
      return { ...state, sellerProducts: [...state.sellerProducts, action.payload] };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── This ref lets LoginPage tell the auth listener "I'm handling routing"
  const loginInProgress = useRef(false);
  const askProfileSetupRef = useRef(false);

  useEffect(() => {
    askProfileSetupRef.current = state.askProfileSetup;
  }, [state.askProfileSetup]);

  const isProfileComplete = (userData) => {
    const hasName = !!userData?.name?.trim();
    const hasContact = !!userData?.email?.trim() || !!userData?.phoneNumber?.trim();
    const hasRole = !!userData?.role;
    const hasAddress = !!userData?.address?.trim();

    if (!hasName || !hasContact || !hasRole || !hasAddress) return false;
    if (userData.role === "seller") {
      return !!userData?.shopName?.trim() && !!userData?.description?.trim() && !!userData?.availableTiming?.trim();
    }
    return true;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      // If LoginPage is actively doing OTP verify, skip — it will route itself
      if (loginInProgress.current) return;

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};

          dispatch({
            type: "SET_USER",
            payload: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              phoneNumber: firebaseUser.phoneNumber || "",
              ...userData
            },
          });

          if (userData.role) {
            localStorage.setItem("userRole", userData.role);
          }

          if (askProfileSetupRef.current || !isProfileComplete(userData)) {
            if (askProfileSetupRef.current) {
              dispatch({ type: "SET_ASK_PROFILE_SETUP", payload: false });
            }
            dispatch({ type: "SET_PAGE", payload: "profileSetup" });
          } else {
            dispatch({
              type: "SET_PAGE",
              payload: userData.role === "seller" ? "seller" : "home",
            });
          }
        } catch (err) {
          console.error("Auth restore error:", err);
          dispatch({ type: "SET_PAGE", payload: "login" });
        }
      } else {
        dispatch({ type: "SET_PAGE", payload: "login" });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    // ── Expose loginInProgress ref so LoginPage can set it
    <AppContext.Provider value={{ state, dispatch, loginInProgress }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}