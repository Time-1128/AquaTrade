import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import SellerDashboard from "./pages/SellerDashboard";
import CheckoutPage from "./pages/CheckoutPage";
import { AppProvider, useApp } from "../context/AppContext";
import "./styles/globals.css";

function AppRouter() {
  const { state } = useApp();
  const { currentPage, user } = state;

  if (currentPage === "landing") return <LandingPage />;
  if (currentPage === "login") return <LoginPage />;
  if (currentPage === "roleSelect") return <RoleSelectPage />;
  if (currentPage === "home") return <HomePage />;
  if (currentPage === "product") return <ProductDetailPage />;
  if (currentPage === "cart") return <CartPage />;
  if (currentPage === "profile") return <ProfilePage />;
  if (currentPage === "seller") return <SellerDashboard />;
  if (currentPage === "checkout") return <CheckoutPage />;
  return <LandingPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
