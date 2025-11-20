import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getMe, logout } from "@/api/api";
import { useEffect, useState } from "react";

export default function Navbar() {
    const nav = useNavigate();
    const [user, setUser] = useState(null);
    const location = useLocation();


    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await getMe();
                if (alive) setUser(res?.data ?? res);
            } catch {
                if (alive) setUser(null);
            }
        })();
        return () => { alive = false; };
    }, [location.pathname]);

    const item = "px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition";
    const active = "bg-white/20";

    const handleLogout = async () => {
        try { await logout(); } catch {}
        setUser(null);
        nav("/login", { replace: true });
    };

    return (
        <nav className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                <div className="font-semibold tracking-tight">Nome da empresa aqui ou logo</div>
                <div className="flex items-center gap-2">
                    <NavLink to="/recebimento" className={({isActive}) => `${item} ${isActive?active:""}`}>Recebimento</NavLink>
                    <NavLink to="/venda"       className={({isActive}) => `${item} ${isActive?active:""}`}>Vendas</NavLink>
                    <NavLink to="/ajustes"     className={({isActive}) => `${item} ${isActive?active:""}`}>Ajustes</NavLink>
                    <NavLink to="/estoque"     className={({isActive}) => `${item} ${isActive?active:""}`}>Estoque</NavLink>
                    <NavLink to="/clientes" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Clientes</NavLink>

                    <div className="h-6 w-px bg-white/40 mx-2" />
                    {user ? (
                        <div className="flex items-center gap-2">
              <span className="text-sm/none">
                Olá, <b>{user.username}</b> ({user.role})
              </span>
                            <button
                                onClick={handleLogout}
                                className="ml-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg"
                            >
                                Sair
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/login" className={({isActive}) => `${item} ${isActive?active:""}`}>Login</NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}
