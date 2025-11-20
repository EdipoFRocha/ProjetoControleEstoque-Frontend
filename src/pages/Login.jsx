import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { login, getMe, extractApiError } from "@/api/api";
import HelpTip from "@/components/ui/HelpTip"; // <== novo componente de ajuda

export default function Login() {
    const nav = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/recebimento";

    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            await login(form);
            await getMe().catch(() => {});
            toast.success("Login efetuado!");
            nav(from, { replace: true });
        } catch (err) {
            toast.error(extractApiError(err) || "Usuário ou senha inválidos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-slate-100">
            <form
                onSubmit={submit}
                autoComplete="off"
                className="bg-white p-6 rounded-2xl shadow w-full max-w-sm space-y-4"
            >
                <h1 className="text-lg font-semibold">Login</h1>

                <div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        Usuário
                        <HelpTip text="Seu identificador de acesso ao sistema. Ex.: supervisor, operador." />
                    </label>
                    <input
                        name="username"
                        value={form.username}
                        onChange={onChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        autoFocus
                        autoComplete="username"
                        inputMode="text"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        Senha
                        <HelpTip text="Senha pessoal para autenticação. Evite compartilhar e use senhas fortes." />
                    </label>
                    <div className="flex items-stretch gap-2">
                        <input
                            type={showPwd ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={onChange}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPwd((v) => !v)}
                            className="px-3 rounded-lg border text-xs hover:bg-slate-50"
                            title={showPwd ? "Ocultar senha" : "Mostrar senha"}
                        >
                            {showPwd ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-60"
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
