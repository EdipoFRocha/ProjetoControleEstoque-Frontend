import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { listUsers, createUser, toggleUserActive } from "@/api/api";
import {
  UserPlus,
  Users,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import SearchPanel from "@/components/ui/SearchPanel";

const ROLES = [
  { value: "GERENTE", label: "Gerente" },
  { value: "SUPERVISAO", label: "Supervisão" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "RH", label: "RH" },
  { value: "OPERADOR", label: "Operador" },
];

const ROLE_BADGES = {
  GERENTE: { label: "Gerente", className: "bg-indigo-100 text-indigo-700" },
  SUPERVISAO: { label: "Supervisão", className: "bg-amber-100 text-amber-700" },
  LOGISTICA: { label: "Logística", className: "bg-emerald-100 text-emerald-700" },
  RH: { label: "RH", className: "bg-sky-100 text-sky-700" },
  OPERADOR: { label: "Operador", className: "bg-slate-100 text-slate-700" },
};

function normalizeRole(r) {
  if (!r) return "";
  return String(r).toUpperCase().replace(/^ROLE_/, "").trim();
}

function renderRoleBadges(roles) {
  if (!roles) return <span className="text-xs text-slate-400">—</span>;

  const list = Array.isArray(roles) ? roles : [roles];
  const normalized = list.map(normalizeRole).filter(Boolean);

  if (normalized.length === 0) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1 max-w-full">
      {normalized.map((role) => {
        const info = ROLE_BADGES[role] || {
          label: role,
          className: "bg-slate-100 text-slate-700",
        };
        return (
          <span
            key={role}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.className}`}
            title={role}
          >
            {info.label}
          </span>
        );
      })}
    </div>
  );
}

// senha forte (front)
function isStrongPassword(pw) {
  if (!pw) return false;

  // 8+, maiúscula, minúscula, número, símbolo
  const strong =
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  if (!strong) return false;

  // bloqueios comuns
  const weak = [
    "123456",
    "12345678",
    "123456789",
    "111111",
    "000000",
    "654321",
    "password",
    "senha",
    "qwerty",
    "abc123",
    "123123",
    "iloveyou",
  ];

  const lower = pw.toLowerCase().replace(/\s/g, "");
  if (weak.includes(lower)) return false;

  // sequências muito comuns
  if (/^(0123456789|1234567890)$/.test(lower)) return false;

  return true;
}

export default function UsersPage() {
  const [searchParams] = useSearchParams();

  // /admin/users?companyId=2
  const companyId = useMemo(() => {
    const v = searchParams.get("companyId");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    role: ROLES[0]?.value ?? "OPERADOR",
  });

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [pageError, setPageError] = useState("");

  // inputs (digitados)
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({ q: "", role: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // validação em tempo real (senha + confirmação)
  useEffect(() => {
    // senha
    if (!form.password) {
      setPasswordError("");
    } else if (!isStrongPassword(form.password)) {
      setPasswordError(
        "Senha fraca. Use no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo."
      );
    } else {
      setPasswordError("");
    }

    // confirmação
    if (!form.confirmPassword) {
      setConfirmError("");
    } else if (form.confirmPassword !== form.password) {
      setConfirmError("Senhas incompatíveis.");
    } else {
      setConfirmError("");
    }
  }, [form.password, form.confirmPassword]);

  const loadUsers = async (mode = "initial") => {
    try {
      setPageError("");
      if (mode === "initial") setLoading(true);
      else setReloading(true);

      const res = await listUsers(companyId);
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
      setPageError("Erro ao carregar usuários.");
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    loadUsers("initial");
  }, [companyId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.username.trim() || !form.fullName.trim() || !form.password || !form.confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      toast.error(
        "Senha fraca. Use no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Senhas incompatíveis.");
      return;
    }

    try {
      setSaving(true);

      const { confirmPassword, ...formToSend } = form;
      const payload = companyId ? { ...formToSend, companyId } : formToSend;
      await createUser(payload);


      toast.success("Usuário criado com sucesso!");
      setForm({
        username: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        role: "OPERADOR",
      });

      await loadUsers("reload");
    } catch (e) {
      console.error("Erro ao criar usuário:", e);

      const status = e?.response?.status;
      const data = e?.response?.data;
      const backendError = data?.error || data?.message || data?.detail;

      if (status === 409) {
        toast.error(backendError || "Já existe um usuário com esse login.");
      } else {
        toast.error(backendError || "Erro ao criar usuário.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await toggleUserActive(userId, companyId);
      toast.success("Status do usuário atualizado.");
      await loadUsers("reload");
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const backendError = data?.error || data?.message || data?.detail;

      console.error("Erro ao alterar status do usuário:", { status, data, full: e });

      if (backendError) toast.error(`Erro (${status}): ${backendError}`);
      else if (status) toast.error(`Erro (${status}) ao alterar status do usuário.`);
      else toast.error("Erro ao alterar status do usuário (sem resposta da API).");
    }
  };

  const formInvalid =
    !form.fullName.trim() ||
    !form.username.trim() ||
    !form.password ||
    !form.confirmPassword ||
    !!passwordError ||
    !!confirmError ||
    saving;

  const applyFilters = () => {
    setAppliedFilters({ q, role: roleFilter });
  };

  const clearFilters = () => {
    setQ("");
    setRoleFilter("");
    setAppliedFilters({ q: "", role: "" });
  };

  const filteredUsers = useMemo(() => {
    const term = (appliedFilters.q || "").trim().toLowerCase();
    const role = appliedFilters.role || "";

    return (users || []).filter((u) => {
      const matchText =
        !term ||
        String(u.username || "").toLowerCase().includes(term) ||
        String(u.fullName || "").toLowerCase().includes(term);

      const rolesArr = Array.isArray(u.roles) ? u.roles : u.roles ? [u.roles] : [];
      const rolesNorm = rolesArr.map(normalizeRole);
      const matchRole = !role || rolesNorm.includes(role);

      return matchText && matchRole;
    });
  }, [users, appliedFilters]);

  const filtersDirty =
    (q || "") !== (appliedFilters.q || "") ||
    (roleFilter || "") !== (appliedFilters.role || "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
              <Users className="w-7 h-7" />
              Usuários
            </h1>
            <p className="mt-1 text-white/90">
              Cadastre e gerencie acessos do sistema por perfil.
            </p>

            {companyId && (
              <div className="mt-2 text-xs text-white/80">
                Contexto: empresa <span className="font-semibold">ID {companyId}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {pageError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">Erro</div>
              <div className="text-red-700/90">{pageError}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-800">
                Novo usuário
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Crie um usuário e atribua um papel. A senha deve ser forte (8+ com maiúscula, minúscula, número e símbolo).
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  placeholder="Ex.: João da Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Usuário (login)
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  placeholder="Ex.: joao.silva"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  className={`w-full rounded-xl bg-white px-3 py-2 text-sm outline-none focus:ring-4 transition ${
                    passwordError
                      ? "border border-rose-400 focus:ring-rose-100 focus:border-rose-500"
                      : "border border-slate-300 focus:ring-sky-100 focus:border-sky-500"
                  }`}
                  placeholder="Ex.: Abc@1234"
                />
                {passwordError && (
                  <p className="mt-1 text-xs text-rose-600">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className={`w-full rounded-xl bg-white px-3 py-2 text-sm outline-none focus:ring-4 transition ${
                    confirmError
                      ? "border border-rose-400 focus:ring-rose-100 focus:border-rose-500"
                      : "border border-slate-300 focus:ring-sky-100 focus:border-sky-500"
                  }`}
                  placeholder="Digite a senha novamente"
                />
                {confirmError && (
                  <p className="mt-1 text-xs text-rose-600">{confirmError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Papel
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={formInvalid}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saving ? "Salvando..." : "Criar usuário"}
              </button>
            </form>
          </section>

          {/* List */}
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800">
                Usuários cadastrados
              </h2>
              <button
                type="button"
                onClick={() => loadUsers("reload")}
                disabled={loading || reloading}
                className="text-xs text-sky-700 hover:text-sky-800 inline-flex items-center gap-2"
              >
                {reloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Recarregar
              </button>
            </div>

            {loading ? (
              <div className="py-4 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando usuários...
              </div>
            ) : users.length === 0 ? (
              <div className="py-4 text-sm text-slate-500">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <SearchPanel
                    value={q}
                    onChange={setQ}
                    placeholder="Buscar por usuário ou nome..."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full sm:w-auto min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Todos os papéis</option>
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={applyFilters}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          <Filter className="w-4 h-4" />
                          Filtrar
                        </button>

                        {(appliedFilters.q || appliedFilters.role) && (
                          <button
                            type="button"
                            onClick={clearFilters}
                            className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-800 underline"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    }
                  />

                  {filtersDirty && (
                    <div className="mt-2 text-xs text-slate-500">
                      Você alterou os filtros. Clique em{" "}
                      <span className="font-semibold">Filtrar</span> para aplicar.
                    </div>
                  )}
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Não há usuário com esse nome (ou papel) para o filtro atual.
                  </div>
                ) : (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">ID</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Usuário</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Nome</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Papéis</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Status</th>
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {filteredUsers.map((u) => {
                          const active = u.isActive ?? u.active ?? true;

                          return (
                            <tr key={u.id} className="bg-white align-top">
                              <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                {u.id ?? "—"}
                              </td>

                              <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                {u.username ?? "—"}
                              </td>

                              <td
                                className="px-3 py-2 text-slate-700 max-w-[260px] truncate"
                                title={u.fullName || ""}
                              >
                                {u.fullName ?? "—"}
                              </td>

                              <td className="px-3 py-2 min-w-[220px]">
                                {renderRoleBadges(u.roles)}
                              </td>

                              <td className="px-3 py-2 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    active
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {active ? "Ativo" : "Inativo"}
                                </span>
                              </td>

                              <td className="px-3 py-2 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(u.id)}
                                  className="text-xs font-medium text-sky-700 hover:text-sky-800 underline"
                                >
                                  {active ? "Desativar" : "Ativar"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
