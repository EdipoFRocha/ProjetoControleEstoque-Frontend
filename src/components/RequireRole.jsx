import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function normalizeRole(role) {
    if (!role) return null;
    return role.toString().toUpperCase().replace(/^ROLE_/, "");
}

export default function RequireRole({ allowedRoles, role, children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-600">
                Carregando...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const baseRole = user.role || null;

    const userRoles = Array.isArray(user.roles)
        ? user.roles.map(normalizeRole)
        : baseRole
        ? [normalizeRole(baseRole)]
        : [];

    const effectiveRoles = allowedRoles ?? role;

    const rolesArray = (Array.isArray(effectiveRoles)
        ? effectiveRoles
        : [effectiveRoles]
    ).map(normalizeRole);

    const hasPermission = userRoles.some((r) => rolesArray.includes(r));

    if (!hasPermission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">
                        Acesso negado
                    </h2>
                    <p className="text-sm text-slate-600">
                        Você não possui permissão para acessar esta página.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                        Seu papel atual:{" "}
                        {userRoles.length ? userRoles.join(", ") : "(nenhum)"}
                    </p>
                </div>
            </div>
        );
    }

    return children;
}
