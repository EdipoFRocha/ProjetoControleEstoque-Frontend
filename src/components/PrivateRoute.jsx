import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function PrivateRoute({ children }) {
    const { loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="p-4 text-sm text-slate-500">
                Verificando sessão…
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
