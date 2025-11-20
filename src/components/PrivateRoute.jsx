// src/components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "@/api/api";

export default function PrivateRoute({ children }) {
    const [state, setState] = useState({ loading: true, ok: false, user: null });
    const location = useLocation();

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const me = await getMe();
                if (alive) setState({ loading: false, ok: true, user: me?.data ?? me });
            } catch {
                if (alive) setState({ loading: false, ok: false, user: null });
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    if (state.loading) return <div className="p-4">Verificando sessão…</div>;
    if (!state.ok) return <Navigate to="/login" replace state={{ from: location }} />;

    return children;
}
