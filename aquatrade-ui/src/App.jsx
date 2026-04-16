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

import { useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";

import "./globals.css";

function AppRouter() {
  const { state, dispatch } = useApp();
  const { currentPage, user } = state;

  useEffect(() => {
    if (user && user.role) {
      const isSeller = user.role === "seller";
      const buyerOnlyRoutes = ["home", "product", "cart", "checkout", "orders"];
      const sellerOnlyRoutes = ["seller"];

      if (isSeller && buyerOnlyRoutes.includes(currentPage)) {
        dispatch({ type: "SET_PAGE", payload: "seller" });
      } else if (!isSeller && sellerOnlyRoutes.includes(currentPage)) {
        dispatch({ type: "SET_PAGE", payload: "home" });
      }
    }
  }, [currentPage, user, dispatch]);

  switch (currentPage) {
    case "landing":
      return <LandingPage />;

    case "login":
      return <LoginPage />;

    case "profileSetup":          // ← NEW — shown after first login
      return <ProfileSetup />;

    case "roleSelect":
      return <RoleSelectPage />;

    case "home":
      return <HomePage />;

    case "product":
      return <ProductDetailPage />;

    case "cart":
      return <CartPage />;

    case "profile":
      return <ProfilePage />;

    case "seller":
      return <SellerDashboard />;

    case "checkout":
      return <CheckoutPage />;

    case "orders":
      return <OrdersPage />;

    default:
      return <LandingPage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}