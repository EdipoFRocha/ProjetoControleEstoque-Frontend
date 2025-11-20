import { useEffect, useMemo, useState } from "react";
import { api, extractApiError, getLocations } from "../api/api";
import {
    getMovements as getAdjustmentMovements,
    postReturn, // qty>0 = ADJUSTMENT_IN ; qty<0 = ADJUSTMENT_OUT
} from "@/api/stock";
import { toast } from "react-hot-toast";

export default function StockAdjustmentPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [recentAdjustments, setRecentAdjustments] = useState([]);

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

    // init
    useEffect(() => {
        (async () => {
            try {
                const [mRes, wRes, movRes] = await Promise.all([
                    api.get("/master-data/materials"),
                    api.get("/master-data/warehouses"),
                    getAdjustmentMovements({ types: "ADJUSTMENT_IN,ADJUSTMENT_OUT", limit: 500 }),
                ]);
                setMaterials(mRes.data || []);
                setWarehouses(wRes.data || []);
                setRecentAdjustments(movRes.data || []);
            } catch (err) {
                toast.error(`Falha ao carregar dados iniciais: ${extractApiError(err)}`);
                console.error("StockAdjustment:init", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // warehouse -> locations
    useEffect(() => {
        if (!form.warehouseId) {
            setLocations([]);
            setForm((f) => ({ ...f, locationId: "" }));
            return;
        }
        (async () => {
            try {
                const res = await getLocations(form.warehouseId);
                setLocations(res.data || []);
            } catch (err) {
                toast.error(`Falha ao carregar locais: ${extractApiError(err)}`);
                console.error("StockAdjustment:locations", err);
            }
        })();
    }, [form.warehouseId]);

    // reset página quando filtros mudarem
    useEffect(() => {
        setPage(1);
    }, [filterMaterialId, filterType, filterWarehouseId, filterDateFrom, filterDateTo, filterNote, pageSize]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (!form.materialId || !form.warehouseId || !form.locationId || !form.qty) {
            toast.error("Preencha material, armazém, local e quantidade.");
            return;
        }

        const qtyNumber = Number(form.qty);
        if (!Number.isFinite(qtyNumber) || qtyNumber === 0) {
            toast.error("Quantidade deve ser um número diferente de zero (positivo = IN, negativo = OUT).");
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

            toast.success("Ajuste registrado com sucesso!");
            setForm({ materialId: "", warehouseId: "", locationId: "", qty: "", note: "" });
            setLocations([]);

            const movRes = await getAdjustmentMovements({
                types: "ADJUSTMENT_IN,ADJUSTMENT_OUT",
                limit: 500,
            });
            setRecentAdjustments(movRes.data || []);
        } catch (err) {
            toast.error(`Falha ao registrar ajuste: ${extractApiError(err)}`);
            console.error("StockAdjustment:submit", err);
        } finally {
            setSubmitting(false);
        }
    };

    const isFormInvalid =
        !form.materialId || !form.warehouseId || !form.locationId || !form.qty || Number(form.qty) === 0;

    // helpers
    const parseDate = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };

    // Filtro combinado + ordenação por data desc
    const filteredSorted = useMemo(() => {
        const from = filterDateFrom ? new Date(`${filterDateFrom}T00:00:00`) : null;
        const to = filterDateTo ? new Date(`${filterDateTo}T23:59:59.999`) : null;

        const passed = recentAdjustments.filter((mv) => {
            if (filterMaterialId && String(mv.materialId) !== String(filterMaterialId)) return false;
            if (filterWarehouseId && String(mv.warehouseId) !== String(filterWarehouseId)) return false;

            if (filterType === "IN" && mv.movementType !== "ADJUSTMENT_IN") return false;
            if (filterType === "OUT" && mv.movementType !== "ADJUSTMENT_OUT") return false;

            if (filterNote && !String(mv.note || "").toLowerCase().includes(filterNote.toLowerCase())) return false;

            if (from || to) {
                const d = parseDate(mv.createdAt);
                if (!d) return false;
                if (from && d < from) return false;
                if (to && d > to) return false;
            }
            return true;
        });

        return passed.sort((a, b) => {
            const da = parseDate(a.createdAt)?.getTime() ?? 0;
            const db = parseDate(b.createdAt)?.getTime() ?? 0;
            return db - da;
        });
    }, [
        recentAdjustments,
        filterMaterialId,
        filterWarehouseId,
        filterType,
        filterDateFrom,
        filterDateTo,
        filterNote,
    ]);

    // paginação
    const total = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = filteredSorted.slice(startIdx, endIdx);

    const goPrev = () => setPage((p) => Math.max(1, p - 1));
    const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

    if (loading) return <div className="p-4">Carregando…</div>;

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <h1 className="text-xl font-semibold">Ajuste de Estoque</h1>

            {/* Formulário */}
            <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex flex-col">
                        <span className="text-sm text-gray-600">Material</span>
                        <select
                            name="materialId"
                            value={form.materialId}
                            onChange={onChange}
                            className="border rounded p-2"
                        >
                            <option value="">— Selecione —</option>
                            {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.code} — {m.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-sm text-gray-600">Armazém</span>
                        <select
                            name="warehouseId"
                            value={form.warehouseId}
                            onChange={onChange}
                            className="border rounded p-2"
                        >
                            <option value="">— Selecione —</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.code} — {w.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-sm text-gray-600">Local</span>
                        <select
                            name="locationId"
                            value={form.locationId}
                            onChange={onChange}
                            className="border rounded p-2"
                            disabled={!locations.length}
                        >
                            <option value="">— Selecione —</option>
                            {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.code} — {l.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-sm text-gray-600">
                            Quantidade (positiva = entrada, negativa = saída)
                        </span>
                        <input
                            type="number"
                            name="qty"
                            value={form.qty}
                            onChange={onChange}
                            className="border rounded p-2"
                            placeholder="Ex.: 10 ou -5"
                            step="any"
                        />
                    </label>
                </div>

                <label className="flex flex-col">
                    <span className="text-sm text-gray-600">Observação</span>
                    <textarea
                        name="note"
                        value={form.note}
                        onChange={onChange}
                        className="border rounded p-2"
                        rows={3}
                        placeholder="Opcional (motivo do ajuste, inventário, quebra, etc.)"
                    />
                </label>

                <button
                    type="submit"
                    disabled={submitting || isFormInvalid}
                    aria-busy={submitting ? "true" : "false"}
                    className={`px-4 py-2 rounded text-white transition
                        ${submitting || isFormInvalid ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                    {submitting ? (
                        <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                            </svg>
                            Registrando…
                        </span>
                    ) : (
                        "Registrar Ajuste"
                    )}
                </button>
            </form>

            {/* Histórico */}
            <section className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Últimos ajustes</h2>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Material */}
                        <label className="text-sm text-gray-600">Material:</label>
                        <select
                            value={filterMaterialId}
                            onChange={(e) => setFilterMaterialId(e.target.value)}
                            className="border rounded p-2 text-sm"
                        >
                            <option value="">— Todos —</option>
                            {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.code} — {m.name}
                                </option>
                            ))}
                        </select>

                        {/* Tipo */}
                        <label className="text-sm text-gray-600 ml-3">Tipo:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border rounded p-2 text-sm"
                        >
                            <option value="">— Todos —</option>
                            <option value="IN">Entrada</option>
                            <option value="OUT">Saída</option>
                        </select>

                        {/* Armazém */}
                        <label className="text-sm text-gray-600 ml-3">Armazém:</label>
                        <select
                            value={filterWarehouseId}
                            onChange={(e) => setFilterWarehouseId(e.target.value)}
                            className="border rounded p-2 text-sm"
                        >
                            <option value="">— Todos —</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.code} — {w.name}
                                </option>
                            ))}
                        </select>

                        {/* Período */}
                        <label className="text-sm text-gray-600 ml-3">De:</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="border rounded p-2 text-sm"
                        />
                        <label className="text-sm text-gray-600">Até:</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="border rounded p-2 text-sm"
                        />

                        {/* Nota contém */}
                        <input
                            type="text"
                            placeholder="Buscar na nota…"
                            value={filterNote}
                            onChange={(e) => setFilterNote(e.target.value)}
                            className="border rounded p-2 text-sm ml-3"
                        />

                        {/* Page size */}
                        <label className="text-sm text-gray-600 ml-3">Itens/página:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="border rounded p-2 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>

                        {(filterMaterialId ||
                            filterType ||
                            filterWarehouseId ||
                            filterDateFrom ||
                            filterDateTo ||
                            filterNote) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterMaterialId("");
                                    setFilterType("");
                                    setFilterWarehouseId("");
                                    setFilterDateFrom("");
                                    setFilterDateTo("");
                                    setFilterNote("");
                                }}
                                className="text-xs px-2 py-1 border rounded hover:bg-gray-50 ml-2"
                                title="Limpar filtros"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                <div className="border rounded">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Material</th>
                                <th className="p-2">Armazém</th>
                                <th className="p-2">Local</th>
                                <th className="p-2">Qtd</th>
                                <th className="p-2">Nota</th>
                                <th className="p-2">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((mv) => (
                                <tr key={mv.id} className="border-t">
                                    <td className="p-2">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-lg
                                                ${
                                                    mv.movementType === "ADJUSTMENT_IN"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : ""
                                                }
                                                ${
                                                    mv.movementType === "ADJUSTMENT_OUT"
                                                        ? "bg-red-100 text-red-700"
                                                        : ""
                                                }`}
                                        >
                                            {mv.movementType === "ADJUSTMENT_IN" && "Entrada"}
                                            {mv.movementType === "ADJUSTMENT_OUT" && "Saída"}
                                        </span>
                                    </td>

                                    <td className="p-2">
                                        {mv.materialCode} — {mv.materialName}
                                    </td>
                                    <td className="p-2">{mv.warehouseCode}</td>
                                    <td className="p-2">{mv.locationCode}</td>
                                    <td
                                        className={`p-2 ${
                                            mv.movementType === "ADJUSTMENT_IN"
                                                ? "text-emerald-700"
                                                : "text-red-700"
                                        }`}
                                    >
                                        {mv.qty}
                                    </td>
                                    <td className="p-2">{mv.note}</td>
                                    <td className="p-2">{mv.createdAt}</td>
                                </tr>
                            ))}

                            {!pageItems.length && (
                                <tr>
                                    <td className="p-2 text-gray-500" colSpan={7}>
                                        {total === 0
                                            ? "Sem ajustes para os filtros selecionados."
                                            : "Página sem itens."}
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        {total > 0 ? (
                            <>
                                Mostrando <strong>{Math.min(total, startIdx + 1)}</strong>–
                                <strong>{Math.min(total, endIdx)}</strong> de{" "}
                                <strong>{total}</strong>
                            </>
                        ) : (
                            "Nenhum registro"
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border ${
                                currentPage === 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            Anterior
                        </button>
                        <span>
                            Página <strong>{currentPage}</strong> /{" "}
                            <strong>{totalPages}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={currentPage === totalPages || total === 0}
                            className={`px-3 py-1 rounded border ${
                                currentPage === totalPages || total === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
