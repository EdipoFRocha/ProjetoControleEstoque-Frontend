import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import toast from "react-hot-toast";

import "@/App.css";

import Navbar from "@/components/ui/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import RequireRole from "@/components/RequireRole";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard.jsx";
import Receipt from "@/pages/Receipt";
import Sales from "@/pages/Sales";
import StockAdjustmentPage from "@/pages/StockAdjustmentPage";
import Inventory from "@/pages/Inventory";
import Customers from "@/pages/Customers.jsx";
import UsersPage from "@/pages/UsersPage";
import MaterialsPage from "@/pages/MaterialsPage";
import Companies from "@/pages/Companies.jsx";
import WarehousesLocationsPage from "@/pages/WarehousesLocationsPage";

import { useAuth } from "@/contexts/AuthContext";
import { AUTH_EVENTS } from "@/api/authEvents";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const hideNavbar = location.pathname === "/login";

  useEffect(() => {
    const on401 = async () => {
      toast.error("Sessão expirada. Faça login novamente.");
      await signOut();
      navigate("/login", { replace: true });
    };

    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, on401);
    return () => window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, on401);
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/recebimento"
          element={
            <PrivateRoute>
              <Receipt />
            </PrivateRoute>
          }
        />

        <Route
          path="/venda"
          element={
            <PrivateRoute>
              <Sales />
            </PrivateRoute>
          }
        />

        <Route
          path="/ajustes"
          element={
            <PrivateRoute>
              <RequireRole allowedRoles={["GERENTE", "SUPERVISAO", "MASTER_ADMIN"]}>
                <StockAdjustmentPage />
              </RequireRole>
            </PrivateRoute>
          }
        />

        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          }
        />

        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <Customers />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <RequireRole allowedRoles={["GERENTE", "SUPERVISAO", "RH", "MASTER_ADMIN"]}>
                <UsersPage />
              </RequireRole>
            </PrivateRoute>
          }
        />

        <Route
          path="/materiais"
          element={
            <PrivateRoute>
              <MaterialsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <RequireRole allowedRoles={["MASTER_ADMIN"]}>
                <Companies />
              </RequireRole>
            </PrivateRoute>
          }
        />

        <Route
          path="/armazens"
          element={
            <PrivateRoute>
              <RequireRole allowedRoles={["GERENTE", "SUPERVISAO", "LOGISTICA", "MASTER_ADMIN"]}>
                <WarehousesLocationsPage />
              </RequireRole>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </div>
  );
}
