import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RoleSelectPage from "./RoleSelectPage";
import HomePage from "./HomePage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage from "./CartPage";
import ProfilePage from "./ProfilePage";
import ProfileSetup from "./ProfileSetup";
import SellerDashboard from "./SellerDashboard";
import CheckoutPage from "./CheckoutPage";
import OrdersPage from "./OrdersPage";

import { useEffect, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext";

import "./globals.css";

// ─────────────────────────────────────────────────────────
//  Hardware Back Button Hook
//  • In Capacitor (Android/iOS): uses @capacitor/app properly
//  • In browser / web preview: falls back to window.popstate
//  • Never crashes — Capacitor is imported lazily so the web
//    build doesn't fail if the plugin isn't present on web.
// ─────────────────────────────────────────────────────────
function useHardwareBackButton(dispatch, state) {
  // Keep refs so the listener closure always reads fresh values
  const pageRef = useRef(state.currentPage);
  const historyRef = useRef(state.pageHistory);

  useEffect(() => { pageRef.current = state.currentPage; }, [state.currentPage]);
  useEffect(() => { historyRef.current = state.pageHistory; }, [state.pageHistory]);

  useEffect(() => {
    let remove = () => {};

    const rootPages = ["home", "seller", "landing", "login"];

    const handleBack = ({ canGoBack } = {}) => {
      const page = pageRef.current;
      const history = historyRef.current;

      if (rootPages.includes(page)) {
        // On a root screen → exit app (native) or do nothing (web)
        import("@capacitor/app")
          .then(({ App: CapApp }) => CapApp.exitApp())
          .catch(() => {/* web — no exit needed */});
      } else if (history.length > 0) {
        dispatch({ type: "BACK" });
      } else if (canGoBack) {
        window.history.back();
      } else {
        import("@capacitor/app")
          .then(({ App: CapApp }) => CapApp.exitApp())
          .catch(() => {/* web */});
      }
    };

    // Try to attach Capacitor back-button listener
    import("@capacitor/app")
      .then(({ App: CapApp }) => {
        // addListener returns a Promise<PluginListenerHandle>
        return CapApp.addListener("backButton", handleBack);
      })
      .then((handle) => {
        remove = () => handle.remove();
      })
      .catch(() => {
        // Running in browser — wire up popstate as fallback
        const onPop = () => handleBack({ canGoBack: false });
        window.addEventListener("popstate", onPop);
        remove = () => window.removeEventListener("popstate", onPop);
      });

    return () => remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount/unmount only — current values read via refs
}

// ─────────────────────────────────────────────────────────
//  Router
// ─────────────────────────────────────────────────────────
function AppRouter() {
  const { state, dispatch } = useApp();
  const { currentPage, user } = state;

  useHardwareBackButton(dispatch, state);

  useEffect(() => {
    if (user && user.role) {
      const isSeller = user.role === "seller";
      const buyerOnly  = ["home", "product", "cart", "checkout", "orders"];
      const sellerOnly = ["seller"];

      if (isSeller && buyerOnly.includes(currentPage)) {
        dispatch({ type: "SET_PAGE", payload: "seller" });
      } else if (!isSeller && sellerOnly.includes(currentPage)) {
        dispatch({ type: "SET_PAGE", payload: "home" });
      }
    }
  }, [currentPage, user, dispatch]);

  switch (currentPage) {
    case "landing":      return <LandingPage />;
    case "login":        return <LoginPage />;
    case "profileSetup": return <ProfileSetup />;
    case "roleSelect":   return <RoleSelectPage />;
    case "home":         return <HomePage />;
    case "product":      return <ProductDetailPage />;
    case "cart":         return <CartPage />;
    case "profile":      return <ProfilePage />;
    case "seller":       return <SellerDashboard />;
    case "checkout":     return <CheckoutPage />;
    case "orders":       return <OrdersPage />;
    default:             return <LandingPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}