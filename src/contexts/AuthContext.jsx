import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logout as apiLogout, login as apiLogin } from "@/api/api";
import { AUTH_EVENTS, resetUnauthorized } from "@/api/authEvents";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {}
    setState({ loading: false, user: null });
  }, []);

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

  useEffect(() => {
    const onUnauthorized = async () => {
      await signOut();
    };

    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
    return () =>
      window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
  }, [signOut]);

  const signIn = async (username, password) => {
    await apiLogin({ username, password });

    const me = await reload();
    if (!me) {
      throw new Error("Falha ao autenticar. Tente novamente.");
    }

    resetUnauthorized();
    return me;
  };

  return (
    <AuthCtx.Provider
      value={{
        loading: state.loading,
        user: state.user,
        reload,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
