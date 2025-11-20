// src/components/RequireRole.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireRole({ role, children }) {
    const { loading, user } = useAuth();

    if (loading) return <div className="p-4">Verificando sessão…</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== role) return <Navigate to="/recebimento" replace />;

    return children;
}
