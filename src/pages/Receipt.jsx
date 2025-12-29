import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api, extractApiError } from "@/api/api";
import LoadingButton from "@/components/ui/LoadingButton";

export default function Receipt() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="w-full px-6 py-10 text-center">
          <h1 className="flex items-center justify-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
            <PackagePlus className="w-7 h-7" />
            Estoque — Recebimento
          </h1>
          <p className="mt-1 text-white/90">
            Registro de entrada de materiais
          </p>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <FormCard />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500">
        Dica:{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd> navega entre campos •{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Shift</kbd> +{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd> volta •{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Enter</kbd> envia
      </footer>
    </div>
  );
}

function FormCard() {
  const [form, setForm] = useState({
    nfNumber: "",
    invoiceItemId: "1",
    materialId: "",
    qty: "",
    warehouseId: "",
    locationId: "",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // combos
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [bootLoading, setBootLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg("");
  };

  const reset = () => {
    setForm((f) => ({
      nfNumber: "",
      invoiceItemId: "1",
      materialId: "",
      qty: "",
      warehouseId: "",
      locationId: "",
      note: "",
    }));
    setResult(null);
    setErrorMsg("");
  };

  // load inicial: materiais + warehouses
  useEffect(() => {
    (async () => {
      setBootLoading(true);
      try {
        const [matsRes, whRes] = await Promise.all([
          api.get("/master-data/materials"),
          api.get("/master-data/warehouses"),
        ]);

        const mats = Array.isArray(matsRes.data) ? matsRes.data : [];
        const whs = Array.isArray(whRes.data) ? whRes.data : [];

        setMaterials(mats);
        setWarehouses(whs);

        if (mats.length === 1) {
          setForm((f) => ({ ...f, materialId: String(mats[0].id) }));
        }
        if (whs.length === 1) {
          setForm((f) => ({ ...f, warehouseId: String(whs[0].id) }));
        }
      } catch (e) {
        toast.error(`Falha ao carregar dados: ${extractApiError(e)}`);
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const warehouseId = Number(form.warehouseId);
    if (!warehouseId) {
      setLocations([]);
      setForm((f) => ({ ...f, locationId: "" }));
      return;
    }

    (async () => {
      setLocLoading(true);
      try {
        const res = await api.get("/master-data/locations", { params: { warehouseId } });
        const locs = Array.isArray(res.data) ? res.data : [];
        setLocations(locs);

        if (locs.length === 1) {
          setForm((f) => ({ ...f, locationId: String(locs[0].id) }));
        } else {
          const current = Number(form.locationId);
          if (current && !locs.some((l) => Number(l.id) === current)) {
            setForm((f) => ({ ...f, locationId: "" }));
          }
        }
      } catch (e) {
        toast.error(`Falha ao carregar locais: ${extractApiError(e)}`);
        setLocations([]);
        setForm((f) => ({ ...f, locationId: "" }));
      } finally {
        setLocLoading(false);
      }
    })();
  }, [form.warehouseId]);

  const materialLabel = useMemo(() => {
    const id = Number(form.materialId);
    const m = materials.find((x) => Number(x.id) === id);
    if (!m) return "";
    return `${m.code ?? ""}${m.code ? " — " : ""}${m.name ?? ""}`.trim();
  }, [form.materialId, materials]);

  const validate = () => {
    if (!form.nfNumber?.trim()) return "Informe o número da NF.";
    const isNum = (v) => v !== "" && !isNaN(Number(v));

    if (!isNum(form.invoiceItemId) || Number(form.invoiceItemId) <= 0)
      return "Item da Nota deve ser um número maior que 0.";

    if (!isNum(form.materialId) || Number(form.materialId) <= 0)
      return "Selecione um material.";

    if (!isNum(form.qty) || Number(form.qty) <= 0)
      return "Quantidade deve ser maior que 0.";

    if (!isNum(form.warehouseId) || Number(form.warehouseId) <= 0)
      return "Selecione um armazém.";

    if (!isNum(form.locationId) || Number(form.locationId) <= 0)
      return "Selecione uma localização.";

    return null;
  };

  const send = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResult(null);

    const err = validate();
    if (err) {
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nfNumber: form.nfNumber.trim(),
        invoiceItemId: Number(form.invoiceItemId),
        materialId: Number(form.materialId),
        qty: Number(form.qty),
        warehouseId: Number(form.warehouseId),
        locationId: Number(form.locationId),
        note: (form.note ?? "").trim(),
      };

      const res = await api.post("/receipts", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setResult(res.data);
      toast.success("Recebimento registrado!");

      setForm((f) => ({
        ...f,
        nfNumber: "",
        invoiceItemId: "1",
        qty: "",
        note: "",
      }));
    } catch (err2) {
      console.error(err2);
      const msg = extractApiError(err2);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
      <div className="w-full px-6 py-8">
        <h2 className="text-lg font-medium tracking-tight">Registrar Recebimento</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Selecione material, armazém e local. O sistema registra o movimento no histórico.
        </p>
      </div>

      <form onSubmit={send} className="p-5">
        {bootLoading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando dados...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldText
              id="nfNumber"
              label="Número da NF"
              value={form.nfNumber}
              onChange={onChange}
              placeholder="Ex.: NF-2025-0001"
            />

            <FieldText
              id="invoiceItemId"
              label="Item da Nota"
              value={form.invoiceItemId}
              onChange={onChange}
              inputProps={{ type: "number", min: 1, step: 1 }}
              placeholder="Ex.: 1"
            />

            {/* Material select */}
            <FieldSelect
              id="materialId"
              label="Material"
              value={form.materialId}
              onChange={onChange}
              placeholder="Selecione..."
              options={materials.map((m) => ({
                value: String(m.id),
                label: `${m.code ?? ""}${m.code ? " — " : ""}${m.name ?? ""}`.trim(),
              }))}
              hint={materialLabel ? `Selecionado: ${materialLabel}` : ""}
            />

            <FieldText
              id="qty"
              label="Quantidade"
              value={form.qty}
              onChange={onChange}
              inputProps={{ type: "number", min: 0, step: "0.001" }}
              placeholder="Ex.: 50"
            />

            {/* Warehouse select */}
            <FieldSelect
              id="warehouseId"
              label="Armazém"
              value={form.warehouseId}
              onChange={onChange}
              placeholder="Selecione..."
              options={warehouses.map((w) => ({
                value: String(w.id),
                label: w.code ? `${w.code} — ${w.name ?? ""}`.trim() : `${w.name ?? `WH ${w.id}`}`,
              }))}
            />

            {/* Location select */}
            <FieldSelect
              id="locationId"
              label="Localização"
              value={form.locationId}
              onChange={onChange}
              placeholder={locLoading ? "Carregando..." : "Selecione..."}
              options={locations.map((l) => ({
                value: String(l.id),
                label: l.code ? `${l.code} — ${l.description ?? l.name ?? ""}`.trim() : `${l.description ?? l.name ?? `LOC ${l.id}`}`,
              }))}
              disabled={!form.warehouseId || locLoading}
              hint={!form.warehouseId ? "Selecione um armazém para listar os locais." : ""}
            />

            <div className="md:col-span-2">
              <label htmlFor="note" className="block text-xs font-medium text-slate-600 mb-1">
                Observação (opcional)
              </label>
              <textarea
                id="note"
                name="note"
                value={form.note}
                onChange={onChange}
                rows={3}
                placeholder="Notas sobre o recebimento…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-3">
          <LoadingButton
            isLoading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow"
            icon={<PackagePlus className="w-4 h-4" />}
            loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
            loadingText="Enviando…"
            disabled={bootLoading}
          >
            Registrar recebimento
          </LoadingButton>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
          >
            <RefreshCw className="w-4 h-4" />
            Limpar
          </button>
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
              <pre className="text-xs mt-1 text-emerald-900/90 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function FieldText({ id, label, value, onChange, placeholder, inputProps = {} }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"
        {...inputProps}
      />
    </div>
  );
}

function FieldSelect({ id, label, value, onChange, options, placeholder, disabled, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition disabled:opacity-70"
      >
        <option value="">{placeholder || "Selecione..."}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}
