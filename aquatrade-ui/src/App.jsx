import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import RoleSelectPage from "./RoleSelectPage";
import HomePage from "./HomePage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage from "./CartPage";
import ProfilePage from "./ProfilePage";
import ProfileSetup from "./ProfileSetup";   // ← NEW
import SellerDashboard from "./SellerDashboard";
import CheckoutPage from "./CheckoutPage";

import { AppProvider, useApp } from "./context/AppContext";

import "./globals.css";

function AppRouter() {
  const { state } = useApp();
  const { currentPage } = state;

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