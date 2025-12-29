import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { extractApiError } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/config/app";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const from = useMemo(() => {
    const p = location.state?.from?.pathname;
    return p && typeof p === "string" ? p : "/";
  }, [location.state]);

  const { signIn } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const username = form.username.trim();
    const password = form.password;

    if (!username) {
      setErrorMsg("Informe o usuário.");
      toast.error("Informe o usuário.");
      return;
    }
    if (!password) {
      setErrorMsg("Informe a senha.");
      toast.error("Informe a senha.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await signIn(username, password);
      toast.success("Login efetuado!");
      nav(from, { replace: true });
    } catch (err) {
      const msg = extractApiError(err) || "Usuário ou senha inválidos";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 grid place-items-center px-4">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white/5 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT: Form */}
          <div className="p-8 md:p-10 bg-slate-950/35">
            <div className="mt-2">
              <h1 className="text-2xl font-semibold text-white">{APP_NAME}</h1>
              <p className="mt-2 text-sm text-white/60">
                Acesse sua conta para continuar.
              </p>
            </div>

            <form onSubmit={submit} autoComplete="off" aria-busy={loading} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Usuário
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  disabled={loading}
                  autoFocus
                  autoComplete="username"
                  inputMode="text"
                  aria-invalid={!!errorMsg}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400/50 transition disabled:opacity-70"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Senha
                </label>

                <div className="flex items-stretch gap-2">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    disabled={loading}
                    autoComplete="current-password"
                    aria-invalid={!!errorMsg}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400/50 transition disabled:opacity-70"
                    placeholder="Digite sua senha"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    disabled={loading}
                    className="px-3 rounded-xl border border-white/10 text-xs font-medium text-white/80 hover:bg-white/5 disabled:opacity-70"
                    title={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 text-sm font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

            </form>
          </div>

          {/* RIGHT: Art */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500" />

            {/* “Ondas”/blobs */}
            <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-fuchsia-400/30 rounded-full blur-3xl" />
            <div className="absolute top-20 right-10 w-[520px] h-[520px] bg-cyan-300/25 rounded-full blur-3xl" />
            <div className="absolute bottom-[-120px] right-[-80px] w-[520px] h-[520px] bg-indigo-900/40 rounded-full blur-3xl" />

            {/* brilho central */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

            {/* texto opcional */}
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <div className="text-xs text-white/80">Bem-vindo ao</div>
              <div className="text-2xl font-semibold tracking-tight">{APP_NAME}</div>
              <div className="mt-1 text-sm text-white/70">
                Controle de estoque e vendas multiempresa.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
