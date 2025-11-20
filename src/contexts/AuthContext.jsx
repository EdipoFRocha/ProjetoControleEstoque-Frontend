// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logout as apiLogout } from "@/api/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [state, setState] = useState({ loading: true, user: null });

    const reload = useCallback(async () => {
        try {
            const { data } = await getMe();
            setState({ loading: false, user: data });
        } catch {
            setState({ loading: false, user: null });
        }
    }, []);

    useEffect(() => { reload(); }, [reload]);

    const signOut = async () => {
        try { await apiLogout(); } catch {}
        setState({ loading: false, user: null });
    };

    return (
        <AuthCtx.Provider value={{ ...state, reload, signOut }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
