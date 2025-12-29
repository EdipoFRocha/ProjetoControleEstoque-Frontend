import { useEffect, useState } from "react";
import { UserPlus, Users, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { api, extractApiError } from "@/api/api";
import LoadingButton from "@/components/ui/LoadingButton";

import EmptyState from "@/components/ui/EmptyState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";

export default function Customers() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
            <UserPlus className="w-7 h-7" />
            Cadastro de Clientes
          </h1>
          <p className="mt-1 text-white/90">
            Registre clientes para vincular às vendas e impressão de pedidos.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <CustomerForm />
        <CustomerList />
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">
        Mantenha os dados de clientes atualizados para que o pedido de venda seja preenchido automaticamente.
      </footer>
    </div>
  );
}

function CustomerForm() {
  const [form, setForm] = useState({
    name: "",
    document: "",
    type: "PJ",
    stateRegistration: "",
    email: "",
    phone: "",
    addressLine: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const reset = () => {
    setForm({
      name: "",
      document: "",
      type: "PJ",
      stateRegistration: "",
      email: "",
      phone: "",
      addressLine: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setSuccessMsg("");
    setErrorMsg("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Informe o nome/razão social do cliente.";
    if (!form.document.trim()) return "Informe o CPF ou CNPJ.";
    if (!form.city.trim()) return "Informe a cidade.";
    if (!form.state.trim()) return "Selecione UF";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      await api.post("/customers", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setSuccessMsg("Cliente cadastrado com sucesso!");
      reset();
    } catch (err2) {
      console.error(err2);
      setErrorMsg(extractApiError(err2));
    } finally {
      setLoading(false);
    }
  };

  async function fetchAddressByCep(cep) {
    const clean = String(cep || "").replace(/\D/g, "");
    if (clean.length !== 8) return null;

    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data?.erro) return null;

    return data;
  }

  const UFS_BR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
      <h2 className="text-lg font-medium tracking-tight mb-1">Novo Cliente</h2>
      <p className="text-sm text-slate-500 mb-4">
        Preencha os dados básicos do cliente. Esses dados serão usados para vendas e na impressão do pedido.
      </p>

      <form onSubmit={submit} className="space-y-4">
        {/* Linha 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nome / Razão Social *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Ex.: Cliente XPTO Ltda."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              CPF / CNPJ *
            </label>
            <input
              name="document"
              value={form.document}
              onChange={onChange}
              placeholder="Ex.: 12.345.678/0001-99"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            />
          </div>
        </div>

        {/* Linha 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select
              name="type"
              value={form.type}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            >
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Inscrição Estadual
            </label>
            <input
              name="stateRegistration"
              value={form.stateRegistration}
              onChange={onChange}
              placeholder="Opcional"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Ex.: contato@cliente.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="Ex.: (47) 99999-9999"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Endereço de Faturamento / Entrega</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro / Rua</label>
              <input
                name="addressLine"
                value={form.addressLine}
                onChange={onChange}
                placeholder="Ex.: Rua das Indústrias"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
              <input
                name="number"
                value={form.number}
                onChange={onChange}
                placeholder="Ex.: 123"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
              <input
                name="complement"
                value={form.complement}
                onChange={onChange}
                placeholder="Ex.: Bloco A, sala 3"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
              <input
                name="district"
                value={form.district}
                onChange={onChange}
                placeholder="Ex.: Distrito Industrial"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
              <input
                name="zipCode"
                value={form.zipCode}
                onChange={onChange}
                onBlur={async () => {
                  const clean = (form.zipCode || "").replace(/\D/g, "");
                  if (clean.length !== 8) return;

                  try {
                    setCepLoading(true);

                    const data = await fetchAddressByCep(form.zipCode);
                    if (!data) {
                      toast.error("CEP não encontrado.");
                      return;
                    }

                    setForm((prev) => ({
                      ...prev,
                      zipCode: data.cep || prev.zipCode,
                      addressLine: prev.addressLine || data.logradouro || "",
                      district: prev.district || data.bairro || "",
                      city: prev.city || data.localidade || "",
                      state: prev.state || data.uf || "",
                    }));

                    toast.success("Endereço preenchido pelo CEP.");
                  } finally {
                    setCepLoading(false);
                  }
                }}
                placeholder="CEP"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={8}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
              {cepLoading && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Buscando endereço pelo CEP...
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cidade *</label>
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                placeholder="Ex.: Joinville"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">UF *</label>
              <select
                name="state"
                value={form.state || ""}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
              >
                <option value="">Selecione</option>
                {UFS_BR.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3">
          <LoadingButton
            isLoading={loading}
            className="bg-sky-600 hover:bg-sky-700 text-white shadow"
            icon={<UserPlus className="w-4 h-4" />}
            loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
            loadingText="Salvando cliente…"
          >
            Salvar cliente
          </LoadingButton>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
          >
            Limpar
          </button>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">Erro</div>
              <div className="text-red-700/90">{errorMsg}</div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">Sucesso</div>
              <div className="text-emerald-900/90">{successMsg}</div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ começa true
  const [errorMsg, setErrorMsg] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2 text-slate-700">
          <Users className="w-4 h-4" />
          Clientes cadastrados
        </h2>
        <button
          type="button"
          onClick={load}
          className="text-xs text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
        >
          Atualizar
        </button>
      </div>

      {loading && <PageSkeleton />}

      {!loading && errorMsg && (
        <ErrorState
          title="Não foi possível carregar clientes"
          description={errorMsg}
          onRetry={load}
        />
      )}

      {!loading && !errorMsg && customers.length === 0 && (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente para usar nas vendas e na impressão de pedidos."
          actionLabel="Cadastrar cliente"
          onAction={() => {
            const el = document.querySelector("input[placeholder='Ex.: Cliente XPTO Ltda.']");
            el?.focus();
          }}
        />
      )}

      {/*  Tabela */}
      {!loading && !errorMsg && customers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[6%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Nome</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Documento</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">Cidade</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">UF</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-600">E-mail</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 align-middle text-left">{c.name}</td>
                  <td className="px-3 py-2 align-middle text-left whitespace-nowrap">{c.document}</td>
                  <td className="px-3 py-2 align-middle text-left">{c.city || "-"}</td>
                  <td className="px-3 py-2 align-middle text-left whitespace-nowrap">{c.state || "-"}</td>
                  <td className="px-3 py-2 align-middle text-left">{c.email || "-"}</td>
                  <td className="px-3 py-2 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditCustomerModal
        open={editOpen}
        customer={selectedCustomer}
        onClose={closeEdit}
        onSaved={load}
      />
    </section>
  );
}

function EditCustomerModal({ open, customer, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && customer) {
      setForm({
        id: customer.id,
        name: customer.name ?? "",
        document: customer.document ?? "",
        type: customer.type ?? "PJ",
        stateRegistration: customer.stateRegistration ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        addressLine: customer.addressLine ?? "",
        number: customer.number ?? "",
        complement: customer.complement ?? "",
        district: customer.district ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
        zipCode: customer.zipCode ?? "",
        active: customer.active ?? true,
      });
      setErrorMsg("");
    }
  }, [open, customer]);

  if (!open || !form) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.name.trim()) return setErrorMsg("Informe o nome/razão social.");
    if (!form.document.trim()) return setErrorMsg("Informe o CPF/CNPJ.");
    if (!form.city.trim()) return setErrorMsg("Informe a cidade.");
    if (!form.state.trim()) return setErrorMsg("Informe o estado (UF).");

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        document: form.document,
        type: form.type,
        stateRegistration: form.stateRegistration,
        email: form.email,
        phone: form.phone,
        addressLine: form.addressLine,
        number: form.number,
        complement: form.complement,
        district: form.district,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        active: form.active,
      };

      await api.put(`/customers/${form.id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Cliente atualizado!");
      await onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setErrorMsg(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* container full width */}
      <div className="relative w-full h-full flex flex-col">
        <div className="w-full h-full bg-white overflow-auto">

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Editar cliente</h3>
              <p className="text-xs text-slate-500">ID: {form.id}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome / Razão Social *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  CPF / CNPJ *
                </label>
                <input
                  name="document"
                  value={form.document}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                >
                  <option value="PJ">Pessoa Jurídica</option>
                  <option value="PF">Pessoa Física</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  name="stateRegistration"
                  value={form.stateRegistration}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-3">
              <p className="text-xs font-semibold text-slate-600">Endereço</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro</label>
                  <input
                    name="addressLine"
                    value={form.addressLine}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                  <input
                    name="number"
                    value={form.number}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
                  <input
                    name="complement"
                    value={form.complement}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                  <input
                    name="zipCode"
                    value={form.zipCode}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cidade *</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado (UF) *</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-medium">Erro</div>
                  <div className="text-red-700/90">{errorMsg}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
              >
                Cancelar
              </button>

              <LoadingButton
                isLoading={loading}
                className="bg-sky-600 hover:bg-sky-700 text-white shadow"
                icon={<CheckCircle2 className="w-4 h-4" />}
                loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
                loadingText="Salvando…"
              >
                Salvar alterações
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
