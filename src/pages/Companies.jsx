import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Loader2,
  RefreshCw,
  Power,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  createCompany,
  listCompanies,
  setCompanyActive,
  extractApiError,
} from "@/api/api";

import EmptyState from "@/components/ui/EmptyState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";

export default function Companies() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);

  const [form, setForm] = useState({
    name: "",
    tradeName: "",
    document: "",

    // contato
    contactName: "",
    email: "",
    phone: "",

    // endereço
    zip: "",
    city: "",
    street: "",
    number: "",
    complement: "",
    state: "",
  });

  const load = useCallback(async (opts = { silent: false }) => {
    try {
      setError("");
      if (opts.silent) setRefreshing(true);
      else setLoading(true);

      const { data } = await listCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = extractApiError(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();

    const name = form.name?.trim();
    if (!name) return toast.error("Nome da empresa é obrigatório.");

    try {
      setSaving(true);

      await createCompany({
        name,
        tradeName: form.tradeName?.trim() || null,
        document: form.document?.trim() || null,
      });

      toast.success("Empresa criada!");
      setForm({
        name: "",
        tradeName: "",
        document: "",
        contactName: "",
        email: "",
        phone: "",
        zip: "",
        city: "",
        street: "",
        number: "",
        complement: "",
        state: "",
      });

      await load({ silent: true });
    } catch (e) {
      toast.error(extractApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (company) => {
    try {
      const next = !company.active;
      await setCompanyActive(company.id, next);
      toast.success(`Empresa ${next ? "ativada" : "desativada"}!`);
      await load({ silent: true });
    } catch (e) {
      toast.error(extractApiError(e));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
        <div className="w-full px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-3">
                <Building2 className="w-7 h-7" />
                Empresas
              </h1>
              <p className="mt-1 text-white/90">
                Cadastro e gerenciamento de empresas (acesso restrito).
              </p>
            </div>

            <button
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Cadastro */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              Nova empresa
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Cadastro da empresa cliente para controle, usuários e cobrança.
            </p>
          </div>

          <form onSubmit={onCreate} className="mt-6 space-y-6">
            {/* Identificação */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Identificação
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Nome *" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} />
                <Input label="Nome fantasia" value={form.tradeName} onChange={(v) => setForm(f => ({ ...f, tradeName: v }))} />
                <Input label="CNPJ" value={form.document} onChange={(v) => setForm(f => ({ ...f, document: v }))} />
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Contato
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Responsável" value={form.contactName} onChange={(v) => setForm(f => ({ ...f, contactName: v }))} />
                <Input label="Email" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} />
                <Input label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Endereço
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="CEP" value={form.zip} onChange={(v) => setForm(f => ({ ...f, zip: v }))} />
                <Input label="Cidade" value={form.city} onChange={(v) => setForm(f => ({ ...f, city: v }))} />
                <Input label="Estado" value={form.state} onChange={(v) => setForm(f => ({ ...f, state: v }))} />
                <Input label="Rua" value={form.street} onChange={(v) => setForm(f => ({ ...f, street: v }))} />
                <Input label="Número" value={form.number} onChange={(v) => setForm(f => ({ ...f, number: v }))} />
                <Input label="Complemento" value={form.complement} onChange={(v) => setForm(f => ({ ...f, complement: v }))} />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Criar empresa
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Lista */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Empresas cadastradas
          </h2>
          <p className="text-sm text-slate-600">
            Total: <span className="font-medium">{companies.length}</span>
          </p>

          {loading && <PageSkeleton />}
          {!loading && error && (
            <ErrorState
              title="Erro ao carregar empresas"
              description={error}
              onRetry={() => load({ silent: false })}
            />
          )}
          {!loading && !error && companies.length === 0 && (
            <EmptyState
              title="Nenhuma empresa cadastrada"
              description="Crie a primeira empresa para começar."
            />
          )}

          {!loading && !error && companies.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-slate-600">
                  <tr>
                    <th className="py-2">ID</th>
                    <th className="py-2">Empresa</th>
                    <th className="py-2">Fantasia</th>
                    <th className="py-2">CNPJ</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3">{c.id}</td>
                      <td className="py-3">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-slate-500">
                          Criada em{" "}
                          {new Date(c.createdAt).toLocaleString("pt-BR")}
                        </div>
                      </td>
                      <td className="py-3">{c.tradeName || "-"}</td>
                      <td className="py-3">{c.document || "-"}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            c.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {c.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <ActionBtn
                            label="Usuários"
                            icon={Users}
                            onClick={() =>
                              navigate(`/usuarios?companyId=${c.id}`)
                            }
                          />
                          <ActionBtn
                            label={c.active ? "Desativar" : "Ativar"}
                            icon={Power}
                            onClick={() => toggleActive(c)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ---------- helpers ---------- */

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-200"
      />
    </div>
  );
}

function ActionBtn({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
