import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  User2,
  Building2,
  Plus,
  Trash2,
  Printer,
  Pencil,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, extractApiError } from "@/api/api";
import LoadingButton from "@/components/ui/LoadingButton";

export default function Sales() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="inline-flex items-center justify-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
              <FileText className="w-7 h-7" />
              Pedido de Venda — Saída
            </h1>
            <p className="mt-1 text-white/90">
              Monte o pedido com itens e registre a saída de estoque.
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <SalesOrderForm />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500">
        Use{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd>{" "}
        para navegar •{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Enter</kbd>{" "}
        para registrar o pedido
      </footer>
    </div>
  );
}

function SalesOrderForm() {
  const [header, setHeader] = useState({
    customerName: "",
    customerDocument: "",
    orderNumber: "",
    paymentTerms: "",
    addressLine: "",
    number: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [orderItems, setOrderItems] = useState([]);
  const [draft, setDraft] = useState({
    materialId: "",
    qty: "",
    warehouseId: "",
    locationId: "",
  });

  const [editingId, setEditingId] = useState(null); // quando != null, estamos editando um item existente

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [sellerCompany, setSellerCompany] = useState(null);

  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [locationsByWh, setLocationsByWh] = useState({});
  const [locationsLoadingWh, setLocationsLoadingWh] = useState({});
  const [company] = useState({
    legalName: "Sua Empresa LTDA",
    tradeName: "Estoque MVP",
    cnpj: "00.000.000/0001-00",
    address: "Rua X, 123 - Bairro - Cidade/UF",
    phone: "(99) 99999-9999",
    email: "contato@suaempresa.com",
  });

  const UFS_BR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  const topRef = useRef(null);

  const onHeaderChange = (e) => {
    setHeader((h) => ({ ...h, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg("");
  };

  const isNum = (v) => v !== "" && !isNaN(Number(v));

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/company/me");
        setSellerCompany(data);
      } catch (e) {
        console.error("Erro ao carregar empresa do usuário logado:", e);
        setSellerCompany(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        const [matsRes, whRes] = await Promise.all([
          api.get("/master-data/materials"),
          api.get("/master-data/warehouses"),
        ]);
        setMaterials(Array.isArray(matsRes.data) ? matsRes.data : []);
        setWarehouses(Array.isArray(whRes.data) ? whRes.data : []);
      } catch (e) {
        toast.error(`Falha ao carregar dados: ${extractApiError(e)}`);
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  const ensureLocations = async (warehouseId) => {
    const wh = Number(warehouseId);
    if (!wh) return;

    if (locationsByWh[wh]) return;
    if (locationsLoadingWh[wh]) return;

    setLocationsLoadingWh((m) => ({ ...m, [wh]: true }));
    try {
      const res = await api.get("/master-data/locations", { params: { warehouseId: wh } });
      const locs = Array.isArray(res.data) ? res.data : [];
      setLocationsByWh((m) => ({ ...m, [wh]: locs }));
    } catch (e) {
      toast.error(`Falha ao carregar locais (WH ${wh}): ${extractApiError(e)}`);
      setLocationsByWh((m) => ({ ...m, [wh]: [] }));
    } finally {
      setLocationsLoadingWh((m) => ({ ...m, [wh]: false }));
    }
  };

  useEffect(() => {
    const wh = Number(draft.warehouseId);
    if (wh > 0) ensureLocations(wh);
  }, [draft.warehouseId]);

  const findMaterial = (materialId) => {
    const idNum = Number(materialId);
    if (!idNum) return null;
    return (materials || []).find((m) => Number(m.id) === idNum) || null;
  };

  const getUnitPrice = (m) => {
    const v = Number(m?.salePrice || 0);
    return !isNaN(v) ? v : 0;
  };

  const materialOptions = useMemo(() => {
    return (materials || []).map((m) => ({
      value: String(m.id),
      label: `${m.code ?? ""}${m.code ? " — " : ""}${m.name ?? ""}`.trim(),
      salePrice: Number(m.salePrice || 0),
    }));
  }, [materials]);

  const warehouseOptions = useMemo(() => {
    return (warehouses || []).map((w) => ({
      value: String(w.id),
      label: w.code ? `${w.code} — ${w.name ?? ""}`.trim() : `${w.name ?? `WH ${w.id}`}`,
    }));
  }, [warehouses]);

  // computed (tabela)
  const computedLines = useMemo(() => {
    return orderItems.map((it) => {
      const mat = findMaterial(it.materialId);
      const unit = mat ? getUnitPrice(mat) : 0;
      const qty = Number(it.qty);
      const subtotal = !isNaN(qty) ? qty * unit : 0;
      return { ...it, material: mat, unitPrice: unit, subtotal };
    });
  }, [orderItems, materials]);

  const total = useMemo(() => {
    return computedLines.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  }, [computedLines]);

  // Item form helpers
  const draftMaterial = useMemo(() => findMaterial(draft.materialId), [draft.materialId, materials]); // eslint-disable-line
  const draftUnitPrice = useMemo(() => (draftMaterial ? getUnitPrice(draftMaterial) : 0), [draftMaterial]); // eslint-disable-line
  const draftSubtotal = useMemo(() => {
    const q = Number(draft.qty);
    if (isNaN(q)) return 0;
    return q * (Number(draftUnitPrice) || 0);
  }, [draft.qty, draftUnitPrice]);

  const setDraftField = (field, value) => {
    setDraft((d) => {
      if (field === "warehouseId") {
        return { ...d, warehouseId: value, locationId: "" };
      }
      return { ...d, [field]: value };
    });
    if (errorMsg) setErrorMsg("");
  };

  const clearDraft = () => {
    setDraft({ materialId: "", qty: "", warehouseId: "", locationId: "" });
    setEditingId(null);
  };

  const validateDraft = () => {
    if (!isNum(draft.materialId) || Number(draft.materialId) <= 0) return "Selecione um material.";
    if (!isNum(draft.qty) || Number(draft.qty) <= 0) return "Quantidade deve ser maior que 0.";
    if (!isNum(draft.warehouseId) || Number(draft.warehouseId) <= 0) return "Selecione um armazém.";
    if (!isNum(draft.locationId) || Number(draft.locationId) <= 0) return "Selecione uma localização.";

    const mat = findMaterial(draft.materialId);
    const price = mat ? getUnitPrice(mat) : 0;
    if (!price || price <= 0) return "Material sem preço cadastrado. Cadastre o preço no Material para vender.";

    return null;
  };

  const addOrUpdateItem = () => {
    const err = validateDraft();
    if (err) {
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    if (editingId != null) {
      setOrderItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                materialId: draft.materialId,
                qty: draft.qty,
                warehouseId: draft.warehouseId,
                locationId: draft.locationId,
              }
            : it
        )
      );
      toast.success("Item atualizado!");
      clearDraft();
      return;
    }

    const nextId = (orderItems.at(-1)?.id ?? 0) + 1;
    setOrderItems((prev) => [
      ...prev,
      {
        id: nextId,
        materialId: draft.materialId,
        qty: draft.qty,
        warehouseId: draft.warehouseId,
        locationId: draft.locationId,
      },
    ]);
    toast.success("Item adicionado!");
    clearDraft();
  };

  const removeItem = (id) => {
    setOrderItems((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) clearDraft();
  };

  const editItem = async (id) => {
    const it = orderItems.find((x) => x.id === id);
    if (!it) return;
    setDraft({
      materialId: it.materialId,
      qty: it.qty,
      warehouseId: it.warehouseId,
      locationId: it.locationId,
    });
    setEditingId(id);

    // garante locais
    await ensureLocations(it.warehouseId);

    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Pedido
  const validateOrder = () => {
    if (!header.customerDocument.trim()) return "Informe o documento do cliente (CNPJ/CPF).";
    if (!header.customerName.trim()) return "Cliente sem nome. Busque um cliente válido ou informe o nome.";
    if (orderItems.length === 0) return "Adicione pelo menos 1 item ao pedido.";

    // valida também se nenhum item ficou sem preço (segurança extra)
    for (const [idx, it] of orderItems.entries()) {
      const linha = idx + 1;
      const mat = findMaterial(it.materialId);
      const price = mat ? getUnitPrice(mat) : 0;
      if (!price || price <= 0) return `Item ${linha}: material sem preço cadastrado.`;
    }

    return null;
  };

  const fetchCustomer = async () => {
    const doc = header.customerDocument.trim();
    if (!doc) return;

    setCustomerLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/customers/by-document", { params: { document: doc } });
      const c = res.data;

      if (!c) {
        const msg = "Cliente não encontrado para o documento informado.";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      setHeader((h) => ({
        ...h,
        customerName: c.name || "",
        customerDocument: c.document || h.customerDocument,
        addressLine: c.addressLine || "",
        number: c.number || "",
        district: c.district || "",
        city: c.city || "",
        state: c.state || "",
        zipCode: c.zipCode || "",
      }));

      toast.success("Cliente carregado!");
    } catch (e) {
      const msg = extractApiError(e);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const resetAll = () => {
    setHeader({
      customerName: "",
      customerDocument: "",
      orderNumber: "",
      paymentTerms: "",
      addressLine: "",
      number: "",
      district: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setOrderItems([]);
    clearDraft();
    setNote("");
    setResult(null);
    setErrorMsg("");
  };

  const send = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const err = validateOrder();
    if (err) {
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setLoading(true);

    try {
      const orderMetaBase = `Cliente: ${header.customerName} | Doc: ${header.customerDocument} | Pedido: ${
        header.orderNumber || "-"
      } | Condição: ${header.paymentTerms || "-"} | Endereço: ${header.addressLine || ""}, ${
        header.number || ""
      } - ${header.district || ""} - ${header.city || ""}/${header.state || ""} CEP ${
        header.zipCode || ""
      } | Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Obs: ${
        note || "-"
      }`;

      const responses = [];
      for (const item of orderItems) {
        const mat = findMaterial(item.materialId);
        const unit = mat ? getUnitPrice(mat) : 0;
        const itemSubtotal = Number(item.qty) * unit;

        const payload = {
          materialId: Number(item.materialId),
          qty: Number(item.qty),
          warehouseId: Number(item.warehouseId),
          locationId: Number(item.locationId),
          note:
            `${orderMetaBase}` +
            ` | Item: ${mat?.code ?? ""} ${mat?.name ?? ""}` +
            ` | Preço: R$ ${unit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` +
            ` | Subtotal: R$ ${itemSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        };

        const res = await api.post("/sales", payload, {
          headers: { "Content-Type": "application/json" },
        });
        responses.push(res.data);
      }

      setResult({
        message: `Pedido registrado!`,
        responses,
      });

      toast.success("Pedido registrado!");
      setOrderItems([]);
      clearDraft();
      setNote("");
    } catch (e2) {
      const msg = extractApiError(e2);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const whId = Number(draft.warehouseId);
  const locs = whId ? locationsByWh[whId] || [] : [];
  const locLoading = whId ? !!locationsLoadingWh[whId] : false;

  return (
      <>
        <div className="no-print bg-white rounded-2xl shadow-sm ring-1 ring-slate-200" id="screen-area">
          <div className="w-full px-6 py-8">
            <div className="text-center">
              <h2 className="text-lg font-medium tracking-tight">
                Pedido de Venda (Saída de Estoque)
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Preencha os dados do cliente e os itens do pedido.
              </p>
            </div>
          </div>

          <form onSubmit={send} className="p-5 space-y-6">
        {/* Cliente */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User2 className="w-4 h-4" />
              Dados do Cliente
            </h3>
            <button
              type="button"
              onClick={fetchCustomer}
              disabled={customerLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 active:scale-[.99] disabled:opacity-60"
            >
              {customerLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <User2 className="w-3 h-3" />}
              Buscar cliente por CPF/CNPJ
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">CPF / CNPJ *</label>
            <input
              name="customerDocument"
              value={header.customerDocument}
              onChange={onHeaderChange}
              placeholder="Ex.: 12.345.678/0001-99"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Digite o CPF/CNPJ e clique em &quot;Buscar cliente&quot; para preencher automaticamente.
            </p>
          </div>

          <LabeledInput
            label="Cliente"
            name="customerName"
            value={header.customerName}
            onChange={onHeaderChange}
            placeholder="Será preenchido ao buscar o cliente"
          />

          <LabeledInput
            label="Número do Pedido"
            name="orderNumber"
            value={header.orderNumber}
            onChange={onHeaderChange}
            placeholder="Ex.: PV-0001"
          />

          <LabeledInput
            label="Condição de Pagamento"
            name="paymentTerms"
            value={header.paymentTerms}
            onChange={onHeaderChange}
            placeholder="Ex.: 28 dias / Boleto"
          />

          {/* Endereço */}
          <div className="md:col-span-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Endereço do Cliente (usado no pedido impresso)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Rua</label>
                <input
                  name="addressLine"
                  value={header.addressLine}
                  onChange={onHeaderChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                <input
                  name="number"
                  value={header.number}
                  onChange={onHeaderChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                <input
                  name="district"
                  value={header.district}
                  onChange={onHeaderChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                <input
                  name="city"
                  value={header.city}
                  onChange={onHeaderChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  UF / CEP
                </label>

                <div className="flex gap-2">
                  {/* UF */}
                  <select
                    name="state"
                    value={header.state || ""}
                    onChange={onHeaderChange}
                    className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                  >
                    <option value="">UF</option>
                    {UFS_BR.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>

                  {/* CEP */}
                  <input
                    name="zipCode"
                    value={header.zipCode}
                    onChange={onHeaderChange}
                    placeholder="CEP"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Item único (add/edit) */}
        <section className="space-y-3" ref={topRef}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Itens do Pedido
            </h3>

            {editingId != null ? (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Editando item #{editingId}
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Adicione itens um por vez para montar a lista.
              </span>
            )}
          </div>

          {bootLoading ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando materiais e armazéns...
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {/* Material */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Material</label>
                  <select
                    value={draft.materialId}
                    onChange={(e) => setDraftField("materialId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                  >
                    <option value="">Selecione...</option>
                    {materialOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qtd */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={draft.qty}
                    onChange={(e) => setDraftField("qty", e.target.value)}
                    placeholder="Ex.: 50"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Armazém</label>
                  <select
                    value={draft.warehouseId}
                    onChange={(e) => setDraftField("warehouseId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                  >
                    <option value="">Selecione...</option>
                    {warehouseOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Localização</label>
                  <select
                    value={draft.locationId}
                    onChange={(e) => setDraftField("locationId", e.target.value)}
                    disabled={!whId || locLoading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition disabled:opacity-70"
                  >
                    <option value="">
                      {!whId ? "Selecione o armazém" : locLoading ? "Carregando..." : "Selecione..."}
                    </option>
                    {locs.map((l) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.code
                          ? `${l.code} — ${l.description ?? l.name ?? ""}`.trim()
                          : `${l.description ?? l.name ?? `LOC ${l.id}`}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preço (readonly) */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preço unitário</label>
                  <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {draft.materialId
                      ? `R$ ${draftUnitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "-"}
                  </div>
                  {draft.materialId && (!draftUnitPrice || draftUnitPrice <= 0) && (
                    <p className="mt-1 text-[11px] text-rose-600">Material sem preço cadastrado.</p>
                  )}
                </div>
              </div>

              {/* subtotal do draft + ações */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Subtotal do item:{" "}
                  <span className="font-semibold text-slate-800">
                    R$ {draftSubtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {editingId != null && (
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
                      title="Cancelar edição"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={addOrUpdateItem}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 px-3 py-2 text-xs font-medium bg-emerald-50 hover:bg-emerald-100"
                  >
                    <Plus className="w-4 h-4" />
                    {editingId != null ? "Atualizar item" : "Adicionar à lista"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tabela Resumo */}
        <section className="border border-slate-200 rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Resumo dos itens</h3>
            <span className="text-xs text-slate-500">
              Total:{" "}
              <span className="font-semibold text-slate-800">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-slate-600">
                <tr>
                  <th className="py-2 text-left">#</th>
                  <th className="py-2 text-left">Material</th>
                  <th className="py-2 text-right">Qtd</th>
                  <th className="py-2 text-right">Preço</th>
                  <th className="py-2 text-right">Subtotal</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {computedLines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Nenhum item adicionado ainda.
                    </td>
                  </tr>
                ) : (
                  computedLines.map((it, idx) => {
                    const label = it.material
                      ? `${it.material.code ? `${it.material.code} — ` : ""}${it.material.name ?? ""}`.trim()
                      : "-";

                    return (
                      <tr key={it.id} className="border-b last:border-0">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2">
                          <div className="text-slate-800">{label}</div>
                          {!!it.materialId && (!it.unitPrice || it.unitPrice <= 0) && (
                            <div className="text-xs text-rose-600">Sem preço</div>
                          )}
                        </td>
                        <td className="py-2 text-right">{it.qty || "-"}</td>
                        <td className="py-2 text-right">
                          {it.materialId
                            ? `R$ ${Number(it.unitPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {it.materialId && it.qty
                            ? `R$ ${Number(it.subtotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => editItem(it.id)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 inline-flex items-center gap-1.5"
                              title="Editar item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => removeItem(it.id)}
                              className="rounded-lg border border-rose-200 text-rose-700 px-2.5 py-1 text-xs hover:bg-rose-50 inline-flex items-center gap-1.5"
                              title="Excluir item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <p className="mt-2 text-[11px] text-slate-500">
              * O preço é usado do cadastro de materias. Materiais sem preço não podem ser vendidos.
            </p>
          </div>
        </section>

        {/* Observações e total */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Observações do Pedido</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Entregar em 48h, frete, contato..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
            />
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/80 space-y-2">
            <h3 className="text-xs font-semibold text-slate-700">Resumo Financeiro</h3>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Total do pedido</span>
              <span className="font-medium">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              * Total calculado automaticamente: quantidade × preço do material.
            </p>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* esquerda */}
          <div className="flex flex-wrap gap-3">
            <LoadingButton
              isLoading={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              icon={<ArrowDownCircle className="w-4 h-4" />}
              loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
              loadingText="Processando pedido…"
              disabled={bootLoading}
            >
              Registrar pedido
            </LoadingButton>

            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar tudo
            </button>
          </div>

          {/* direita */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
              title="Imprimir pedido"
            >
              <Printer className="w-4 h-4" />
              Imprimir pedido
            </button>
          </div>
        </div>

        {/* Feedback */}
        {errorMsg && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">Erro</div>
              <div className="text-red-700/90">{errorMsg}</div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
            <div className="w-full">
              <div className="font-medium">Sucesso</div>
              <p className="text-sm mt-0.5">{result.message}</p>
            </div>
          </div>
        )}
      </form>
    </div>

    {/* ===== BLOCO B: DOCUMENTO PARA IMPRIMIR ===== */}
    <div className="print-only">
            <PrintDocument
              company={sellerCompany}
              header={header}
              note={note}
              lines={computedLines}
              total={total}
            />
          </div>
        </>
      );
    }

    function LabeledInput({ label, name, value, onChange, placeholder }) {
      return (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
          <input
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
          />
        </div>
      );
    }

    function PrintDocument({ company, header, note, lines, total }) {
      const fmtMoney = (v) =>
        `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

      const fmtDate = () => new Date().toLocaleDateString("pt-BR");

      return (
          <div className="print-card p-4">
          {/* Cabeçalho (tipo nota/pedido) */}
          <div className="flex items-start justify-between gap-4 border-b border-black pb-3">
            <div>
              <div className="text-sm font-bold">
                {company?.tradeName || company?.name || "—"}
              </div>

              <div className="text-xs">
                {company?.tradeName ? company?.name : ""}
              </div>

              <div className="text-xs">CNPJ: {company?.document || "-"}</div>

              <div className="text-xs">-</div>

              <div className="text-xs"></div>
            </div>

            <div className="text-right">
              <div className="text-base font-bold">PEDIDO DE VENDA</div>
              <div className="text-xs">Dt Emissão: {fmtDate()}</div>
              <div className="mt-2">
                <div className="text-xs font-semibold">Nº Pedido</div>
                <div className="text-sm font-bold">{header.orderNumber || "-"}</div>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="mt-3 border border-black p-2">
            <div className="text-xs font-bold border-b border-black pb-1">DADOS DO CLIENTE</div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="font-semibold">Cliente:</div>
                <div>{header?.customerName || "-"}</div>
              </div>

              <div>
                <div className="font-semibold">CPF/CNPJ:</div>
                <div>{header?.customerDocument || "-"}</div>
              </div>

              <div className="col-span-2">
                <div className="font-semibold">Endereço:</div>
                <div>
                  {(header?.addressLine || "-")}
                  {header?.number ? `, ${header.number}` : ""}
                  {header?.district ? ` - ${header.district}` : ""}
                  {header?.city ? ` - ${header.city}` : ""}
                  {header?.state ? `/${header.state}` : ""}
                  {header?.zipCode ? ` - CEP ${header.zipCode}` : ""}
                </div>
              </div>

              <div>
                <div className="font-semibold">Condição de Pagamento:</div>
                <div>{header?.paymentTerms || "-"}</div>
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="mt-3 border border-black">
            <table className="text-xs w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="p-2 text-left border-r border-black w-10">Item</th>
                  <th className="p-2 text-left border-r border-black">Descrição</th>
                  <th className="p-2 text-right border-r border-black w-20">Qtd</th>
                  <th className="p-2 text-right border-r border-black w-24">Vlr Unit</th>
                  <th className="p-2 text-right w-24">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(lines || []).map((it, idx) => {
                  const desc = it?.material
                    ? `${it.material.code ? `${it.material.code} — ` : ""}${it.material.name || ""}`.trim()
                    : "-";

                  return (
                    <tr key={it.id ?? idx} className="border-b border-black">
                      <td className="p-2 border-r border-black">{idx + 1}</td>
                      <td className="p-2 border-r border-black">{desc}</td>
                      <td className="p-2 text-right border-r border-black">{it.qty}</td>
                      <td className="p-2 text-right border-r border-black">{fmtMoney(it.unitPrice)}</td>
                      <td className="p-2 text-right">{fmtMoney(it.subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totais + Observações */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="col-span-2 border border-black p-2">
              <div className="text-xs font-bold border-b border-black pb-1">OBSERVAÇÕES</div>
              <div className="text-xs mt-2 whitespace-pre-wrap">{note || "-"}</div>
            </div>

            <div className="border border-black p-2">
              <div className="text-xs font-bold border-b border-black pb-1">TOTAIS</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span>Total do Pedido</span>
                <span className="font-bold">{fmtMoney(total)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }