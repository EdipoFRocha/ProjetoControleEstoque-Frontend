import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logout as apiLogout, login as apiLogin } from "@/api/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  const reload = useCallback(async () => {
    try {
      const { data } = await getMe();
      setState({ loading: false, user: data });
      return data;
    } catch {
      setState({ loading: false, user: null });
      return null;
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const signIn = async (username, password) => {
    // Faz login no backend (seta cookie/JWT no httpOnly, etc.)
    await apiLogin({ username, password });

    // Depois do login, busca /me e atualiza estado
    const me = await reload();

    if (!me) {
      throw new Error("Falha ao autenticar. Tente novamente.");
    }

    return me;
  };

  const signOut = async () => {
    try {
      await apiLogout();
    } catch {}
    setState({ loading: false, user: null });
  };

  return (
    <AuthCtx.Provider value={{ ...state, reload, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
