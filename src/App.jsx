import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "@/App.css";
import Customers from "@/pages/Customers.jsx";

import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/ui/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import RequireRole from "@/components/RequireRole";

import Receipt from "@/pages/Receipt";
import Sales from "@/pages/Sales";
import StockAdjustmentPage from "@/pages/StockAdjustmentPage";
import Inventory from "@/pages/Inventory";
import Login from "@/pages/Login";

export default function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
                <Navbar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Navigate to="/recebimento" replace />} />
                    <Route path="/recebimento" element={<PrivateRoute><Receipt /></PrivateRoute>} />
                    <Route path="/venda" element={<PrivateRoute><Sales /></PrivateRoute>} />
                    <Route path="/ajustes" element={<PrivateRoute><RequireRole role="SUPERVISOR"><StockAdjustmentPage /></RequireRole></PrivateRoute>} />
                    <Route path="/estoque" element={<PrivateRoute><Inventory /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/recebimento" replace />} />
                    <Route path="/clientes" element={<Customers />} />

                </Routes>
            </div>
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </AuthProvider>
    );
}
