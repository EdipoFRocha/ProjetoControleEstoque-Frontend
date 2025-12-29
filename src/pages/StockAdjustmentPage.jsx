import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  SlidersHorizontal,
  Wrench,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { api, extractApiError } from "@/api/api";
import { getMovements, postReturn } from "@/api/stock";

import StateBlock from "@/components/ui/StateBlock";
import MovementBadge from "@/components/ui/MovementBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {

  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function normalizeMovements(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function fmtQty(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).replace("T", " ").slice(0, 19);
  return d.toLocaleString("pt-BR");
}

export default function StockAdjustmentPage() {
  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [moves, setMoves] = useState([]);
  const [err, setErr] = useState("");

  // filtros
  const [filterMaterialId, setFilterMaterialId] = useState("");
  const [filterType, setFilterType] = useState(""); // "" | "IN" | "OUT"
  const [filterWarehouseId, setFilterWarehouseId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState(""); // yyyy-mm-dd
  const [filterDateTo, setFilterDateTo] = useState("");     // yyyy-mm-dd
  const [filterNote, setFilterNote] = useState("");

  // paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [form, setForm] = useState({
    materialId: "",
    warehouseId: "",
    locationId: "",
    qty: "",
    note: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === "warehouseId") return { ...f, warehouseId: value, locationId: "" };
      return { ...f, [name]: value };
    });
  };

  async function loadBase() {
    setErr("");
    setBootLoading(true);

    try {
      const [mRes, wRes, movRes] = await Promise.all([
        api.get("/master-data/materials"),
        api.get("/master-data/warehouses"),
        getMovements({ types: "ADJUSTMENT_IN,ADJUSTMENT_OUT", limit: 2000 }),
      ]);

      setMaterials(Array.isArray(mRes.data) ? mRes.data : []);
      setWarehouses(Array.isArray(wRes.data) ? wRes.data : []);
      setMoves(Array.isArray(movRes.data) ? movRes.data : []);
    } catch (e) {
      const msg = extractApiError(e);
      setErr(msg);
      toast.error(`Falha ao carregar dados: ${msg}`);
    } finally {
      setBootLoading(false);
    }
  }

  async function loadMoves() {
    try {
      const movRes = await getMovements({
        types: "ADJUSTMENT_IN,ADJUSTMENT_OUT",
        limit: 2000,
      });

      setMoves(Array.isArray(movRes.data) ? movRes.data : []);
    } catch (e) {
      toast.error(`Falha ao atualizar ajustes: ${extractApiError(e)}`);
      setMoves([]);
    }
  }


  useEffect(() => {
    loadBase();
  }, []);

  // warehouse -> locations
  useEffect(() => {
    const wh = Number(form.warehouseId);
    if (!wh) {
      setLocations([]);
      setForm((f) => ({ ...f, locationId: "" }));
      return;
    }

    (async () => {
      setLocationsLoading(true);
      try {
        const res = await api.get("/master-data/locations", { params: { warehouseId: wh } });
        setLocations(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        toast.error(`Falha ao carregar locais: ${extractApiError(e)}`);
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    })();
  }, [form.warehouseId]);

  // reset página quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [filterMaterialId, filterType, filterWarehouseId, filterDateFrom, filterDateTo, filterNote, pageSize]);

  const isFormInvalid =
    !form.materialId ||
    !form.warehouseId ||
    !form.locationId ||
    !form.qty ||
    Number(form.qty) === 0;

  const clearFilters = () => {
    setFilterMaterialId("");
    setFilterType("");
    setFilterWarehouseId("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterNote("");
  };

  // filtros + ordenação
  const filteredSorted = useMemo(() => {
    const from = filterDateFrom ? new Date(`${filterDateFrom}T00:00:00`) : null;
    const to = filterDateTo ? new Date(`${filterDateTo}T23:59:59.999`) : null;

    const ok = (mv) => {
      if (filterMaterialId && String(mv.materialId) !== String(filterMaterialId)) return false;
      if (filterWarehouseId && String(mv.warehouseId) !== String(filterWarehouseId)) return false;

      const type = mv.type || mv.movementType;
      if (filterType === "IN" && type !== "ADJUSTMENT_IN") return false;
      if (filterType === "OUT" && type !== "ADJUSTMENT_OUT") return false;

      if (filterNote && !String(mv.note || "").toLowerCase().includes(filterNote.toLowerCase())) return false;

      if (from || to) {
        const d = new Date(mv.createdAt);
        if (isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }

      return true;
    };

    const arr = (moves || []).filter(ok);
    arr.sort((a, b) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });
    return arr;
  }, [moves, filterMaterialId, filterWarehouseId, filterType, filterDateFrom, filterDateTo, filterNote]);

  // paginação
  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = filteredSorted.slice(startIdx, endIdx);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const qtyNumber = Number(form.qty);
    if (!Number.isFinite(qtyNumber) || qtyNumber === 0) {
      toast.error("Quantidade deve ser diferente de zero (positivo = entrada, negativo = saída).");
      return;
    }

    try {
      setSubmitting(true);

      await postReturn({
        materialId: Number(form.materialId),
        warehouseId: Number(form.warehouseId),
        locationId: Number(form.locationId),
        qty: qtyNumber,
        note: form.note || "",
      });

      toast.success("Ajuste registrado!");
      setForm({ materialId: "", warehouseId: "", locationId: "", qty: "", note: "" });
      setLocations([]);
      await loadMoves();
    } catch (e2) {
      toast.error(`Falha ao registrar ajuste: ${extractApiError(e2)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 relative">

          {/* TÍTULO */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight">
              <Wrench className="w-7 h-7" />
              Ajustes de Estoque
            </h1>
            <p className="mt-1 text-white/90 text-sm">
              Ajuste manual (IN/OUT) com rastreabilidade, filtros e histórico.
            </p>
          </div>

          {/* LAYOUT OPERACIONAL */}
          <div className="flex items-center justify-end">
            <Button
              onClick={loadBase}
              disabled={bootLoading}
              variant="secondary"
              className="bg-white/15 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
              {bootLoading ? "Atualizando..." : "Recarregar"}
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {err ? (
          <StateBlock
            state="error"
            title="Falha ao carregar Ajustes"
            description={err}
            action={<Button onClick={loadBase}>Tentar novamente</Button>}
          />
        ) : bootLoading ? (
          <StateBlock state="loading" title="Carregando dados..." />
        ) : (
          <>
            {/* Form */}
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Registrar ajuste</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Use quantidade positiva para entrada (IN) e negativa para saída (OUT).
                  </p>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Material">
                    <select
                      name="materialId"
                      value={form.materialId}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                    >
                      <option value="">— Selecione —</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} — {m.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Armazém">
                    <select
                      name="warehouseId"
                      value={form.warehouseId}
                      onChange={onChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                    >
                      <option value="">— Selecione —</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} — {w.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Local">
                    <select
                      name="locationId"
                      value={form.locationId}
                      onChange={onChange}
                      disabled={!form.warehouseId || locationsLoading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                    >
                      <option value="">
                        {!form.warehouseId
                          ? "Selecione o armazém"
                          : locationsLoading
                          ? "Carregando..."
                          : "— Selecione —"}
                      </option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code} — {l.description ?? l.name ?? ""}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Quantidade (IN + / OUT -)">
                    <Input
                      type="number"
                      name="qty"
                      value={form.qty}
                      onChange={onChange}
                      placeholder="Ex.: 10 ou -5"
                      step="0.0001"
                    />
                  </Field>

                  <Field label="Observação" className="md:col-span-2">
                    <Input
                      name="note"
                      value={form.note}
                      onChange={onChange}
                      placeholder="Motivo do ajuste (inventário, quebra, correção, etc.)"
                    />
                  </Field>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || isFormInvalid}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar ajuste"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setForm({ materialId: "", warehouseId: "", locationId: "", qty: "", note: "" });
                      setLocations([]);
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </section>

            {/* Filtros */}
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-700">Filtros do histórico</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={loadMoves}>
                    Atualizar histórico
                  </Button>
                  <Button variant="secondary" onClick={clearFilters} disabled={!(
                    filterMaterialId || filterType || filterWarehouseId || filterDateFrom || filterDateTo || filterNote
                  )}>
                    Limpar filtros
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <Field label="Material">
                  <select
                    value={filterMaterialId}
                    onChange={(e) => setFilterMaterialId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  >
                    <option value="">— Todos —</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} — {m.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tipo">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  >
                    <option value="">— Todos —</option>
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                  </select>
                </Field>

                <Field label="Armazém">
                  <select
                    value={filterWarehouseId}
                    onChange={(e) => setFilterWarehouseId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  >
                    <option value="">— Todos —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="De">
                  <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                </Field>

                <Field label="Até">
                  <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                </Field>

                <Field label="Nota contém">
                  <Input
                    value={filterNote}
                    onChange={(e) => setFilterNote(e.target.value)}
                    placeholder="ex.: inventário"
                  />
                </Field>

                <Field label="Itens/página" className="md:col-span-2">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </Field>

                <div className="md:col-span-4 flex items-end justify-end text-xs text-slate-500">
                  {total > 0 ? (
                    <>
                      Mostrando <span className="font-semibold">{Math.min(total, startIdx + 1)}</span>–
                      <span className="font-semibold">{Math.min(total, endIdx)}</span> de{" "}
                      <span className="font-semibold">{total}</span>
                    </>
                  ) : (
                    "Nenhum registro"
                  )}
                </div>
              </div>
            </section>

            {/* Tabela */}
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Últimos ajustes</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  Página <span className="font-semibold">{currentPage}</span> /{" "}
                  <span className="font-semibold">{totalPages}</span>
                </div>
              </div>

              {total === 0 ? (
                <StateBlock
                  state="empty"
                  title="Sem ajustes para os filtros selecionados"
                  description="Quando você registrar ajustes (IN/OUT), eles aparecerão aqui."
                />
              ) : (
                <>
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>WH</TableHead>
                          <TableHead>Loc</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageItems.map((mv) => (
                          <TableRow key={mv.id}>
                            <TableCell>{mv.id}</TableCell>
                            <TableCell>
                              <MovementBadge type={mv.type || mv.movementType} />
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate" title={`${mv.materialCode || ""} ${mv.materialName || ""}`.trim()}>
                              {mv.materialCode ? `${mv.materialCode} — ${mv.materialName || ""}` : (mv.materialId ?? "-")}
                            </TableCell>
                            <TableCell>{mv.warehouseCode ?? mv.warehouseId ?? "-"}</TableCell>
                            <TableCell>{mv.locationCode ?? mv.locationId ?? "-"}</TableCell>
                            <TableCell className="text-right">{fmtQty(mv.qty)}</TableCell>
                            <TableCell className="max-w-[260px] truncate" title={mv.note}>
                              {mv.note || "-"}
                            </TableCell>
                            <TableCell>{fmtDate(mv.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Button variant="secondary" onClick={goPrev} disabled={currentPage === 1}>
                      Anterior
                    </Button>
                    <Button variant="secondary" onClick={goNext} disabled={currentPage === totalPages || total === 0}>
                      Próximo
                    </Button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
