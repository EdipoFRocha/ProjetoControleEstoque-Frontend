import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/config/app";

function normalizeRole(r) {
  if (!r) return "";
  return r.toString().toUpperCase().replace(/^ROLE_/, "");
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const itemClass =
    "px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition";
  const activeClass = "bg-white/20";

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

const normalizedRoles = (user?.roles || []).map(normalizeRole).filter(Boolean);
const primaryRole = normalizedRoles[0] || normalizeRole(user?.role);

const roleSet = new Set([primaryRole, ...normalizedRoles].filter(Boolean));

// Helpers
const has = (...roles) => roles.some((r) => roleSet.has(r));


  const isMaster = has("MASTER_ADMIN");
  const isGerente = has("GERENTE");
  const isSupervisao = has("SUPERVISAO");
  const isLogistica = has("LOGISTICA");
  const isOperador = has("OPERADOR");
  const isRh = has("RH");

  const canSeeCompanies = isMaster;

  const canSeeDashboard = !!user;

  const canSeeReceiving = isMaster || isGerente || isSupervisao || isLogistica || isOperador;

  const canSeeSales = isMaster || isGerente || isSupervisao || isOperador;

  const canSeeAdjustments = isMaster || isGerente || isSupervisao || isLogistica;

  const canSeeWarehousesLocations = isMaster || isGerente || isSupervisao || isLogistica;

  const canSeeStock = isMaster || isGerente || isSupervisao || isLogistica || isOperador;

  const canSeeCustomers = isMaster || isGerente || isSupervisao || isOperador;

  const canSeeMaterials = isMaster || isGerente || isSupervisao || isLogistica;

  const canSeeUsers = isMaster || isGerente || isSupervisao || isRh;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white sticky top-0 z-50">
      <div className="w-full px-6 h-14 flex items-center justify-between gap-4">
        {/* ESQUERDA: Marca + Links */}
        <div className="flex items-center gap-6 min-w-0">
          {/* Marca */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="font-semibold tracking-tight">{APP_NAME}</div>
            {primaryRole && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-white/95">
                {primaryRole}
              </span>
            )}
          </div>

          {/* Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1 min-w-0">
              {canSeeCompanies && (
                <NavLink
                  to="/companies"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Empresas
                </NavLink>
              )}

              {canSeeDashboard && (
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                  end
                >
                  Dashboard
                </NavLink>
              )}

              {canSeeReceiving && (
                <NavLink
                  to="/recebimento"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Recebimento
                </NavLink>
              )}

              {canSeeSales && (
                <NavLink
                  to="/venda"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Vendas
                </NavLink>
              )}

              {canSeeAdjustments && (
                <NavLink
                  to="/ajustes"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Ajustes
                </NavLink>
              )}

              {canSeeWarehousesLocations && (
                <NavLink
                  to="/armazens"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Armazéns/Locais
                </NavLink>
              )}

              {canSeeStock && (
                <NavLink
                  to="/estoque"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Estoque
                </NavLink>
              )}

              {canSeeCustomers && (
                <NavLink
                  to="/clientes"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Clientes
                </NavLink>
              )}

              {canSeeMaterials && (
                <NavLink
                  to="/materiais"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Materiais
                </NavLink>
              )}

              {canSeeUsers && (
                <NavLink
                  to="/usuarios"
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? activeClass : ""}`
                  }
                >
                  Usuários
                </NavLink>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-indigo-100 hidden sm:inline">
              Olá, <span className="font-semibold">{user.username}</span>
            </span>

            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-white/15 text-xs font-medium hover:bg-white/25"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
