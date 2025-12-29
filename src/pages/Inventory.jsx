import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import StateBlock from "@/components/ui/StateBlock";
import MovementBadge from "@/components/ui/MovementBadge";
import { api, extractApiError } from "@/api/api";
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

import { getStock, getMovements, postReturn, postTransferByCode } from "@/api/stock";

export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [stock, setStock] = useState([]);
  const [moves, setMoves] = useState([]);

  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(true);

  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [locationsByWarehouse, setLocationsByWarehouse] = useState({});

  // seleção em memória
  const [materialId, setMaterialId] = useState(0);

  // filtros do saldo
  const [filterWarehouseId, setFilterWarehouseId] = useState(""); // "" = todos
  const [filterLocationId, setFilterLocationId] = useState("");   // "" = todos (dentro do warehouse)

  const [retForm, setRetForm] = useState({
    warehouseId: "",
    locationId: "",
    qty: 10,
    note: "Devolução",
  });

  const [trfForm, setTrfForm] = useState({
    warehouseId: "",
    fromLocationCode: "",
    toLocationCode: "",
    qty: 5,
    note: "Transferência",
  });

  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // base load (materiais + armazéns)
  useEffect(() => {
    (async () => {
      setMaterialsLoading(true);
      setWarehousesLoading(true);
      try {
        const [mRes, wRes] = await Promise.all([
          api.get("/master-data/materials"),
          api.get("/master-data/warehouses"),
        ]);

        const mats = Array.isArray(mRes.data) ? mRes.data : [];
        setMaterials(mats);

        const whList = Array.isArray(wRes.data) ? wRes.data : [];
        setWarehouses(whList);

        if (mats.length > 0 && (!materialId || Number(materialId) === 0)) {
          setMaterialId(Number(mats[0].id));
        }

        if (whList.length > 0) {
          const firstWhId = String(whList[0].id);

          // forms
          setRetForm((f) => ({ ...f, warehouseId: f.warehouseId || firstWhId }));
          setTrfForm((f) => ({ ...f, warehouseId: f.warehouseId || firstWhId }));
        }
      } catch (e) {
        toast.error(`Erro ao carregar base: ${extractApiError(e)}`);
      } finally {
        setMaterialsLoading(false);
        setWarehousesLoading(false);
      }
    })();
  }, []);

  // locations para os formulários
  useEffect(() => {
    const whId = Number(retForm.warehouseId || 0);
    if (!whId) {
      setLocations([]);
      setRetForm((f) => ({ ...f, locationId: "" }));
      return;
    }

    (async () => {
      setLocationsLoading(true);
      try {
        const res = await api.get("/locations", { params: { warehouseId: whId } });
        const list = Array.isArray(res.data) ? res.data : [];
        setLocations(list);

        if (list.length > 0 && !retForm.locationId) {
          setRetForm((f) => ({ ...f, locationId: String(list[0].id) }));
        }
      } catch (e) {
        toast.error(`Erro ao carregar locais: ${extractApiError(e)}`);
        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    })();
  }, [retForm.warehouseId]);

  useEffect(() => {
    if (!trfForm.warehouseId) return;
    setTrfForm((f) => ({ ...f, fromLocationCode: "", toLocationCode: "" }));
  }, [trfForm.warehouseId]);

  // mapas
  const warehouseMap = useMemo(() => {
    const map = new Map();
    (warehouses || []).forEach((w) => map.set(Number(w.id), `${w.code} — ${w.name}`));
    return map;
  }, [warehouses]);

  const allLocationsByWarehouse = useMemo(() => {
    return new Map();
  }, []);

  const whLabel = (id) => warehouseMap.get(Number(id)) || (id ? `WH ${id}` : "-");

  // refresh estoque/movimentos
  const refresh = useCallback(
    async (opts = { silent: false }) => {
      const silent = !!opts?.silent;

      setErrorMsg("");
      if (silent) setRefreshing(true);
      else setLoading(true);

      if (!materialId || Number(materialId) <= 0) {
        setStock([]);
        setMoves([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const [s, m] = await Promise.all([
          getStock(materialId).then((r) => r.data),
          getMovements({
            types: "RECEIPT,SALE,RETURN,TRANSFER_OUT,TRANSFER_IN,ADJUSTMENT_IN,ADJUSTMENT_OUT",
            limit: 50,
          }).then((r) => r.data),
        ]);

        setStock(Array.isArray(s) ? s : []);
        setMoves(Array.isArray(m) ? m : []);
      } catch (e) {
        setErrorMsg(extractApiError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [materialId]
  );

  async function ensureLocationsLoaded(warehouseId) {
    const wh = Number(warehouseId);
    if (!wh) return;

    if (locationsByWarehouse[wh]) return;

    try {
      const res = await api.get("/locations", { params: { warehouseId: wh } });
      const list = Array.isArray(res.data) ? res.data : [];
      setLocationsByWarehouse((prev) => ({ ...prev, [wh]: list }));
    } catch (e) {
      setLocationsByWarehouse((prev) => ({ ...prev, [wh]: [] }));
    }
  }

  useEffect(() => {
    if (!materialId) return;
    refresh({ silent: false });
  }, [materialId, refresh]);

  useEffect(() => {
    const whIds = new Set();

    (stock || []).forEach((r) => {
      if (r?.warehouseId) whIds.add(Number(r.warehouseId));
    });

    (moves || []).forEach((m) => {
      if (m?.warehouseId) whIds.add(Number(m.warehouseId));
    });

    whIds.forEach((whId) => {
      ensureLocationsLoaded(whId);
    });

  }, [stock, moves]);

  // filtro: carregar locais do armazém selecionado
  const [filterLocations, setFilterLocations] = useState([]);
  const [filterLocationsLoading, setFilterLocationsLoading] = useState(false);

  useEffect(() => {
    if (!filterWarehouseId) {
      setFilterLocations([]);
      setFilterLocationId("");
      return;
    }

    (async () => {
      setFilterLocationsLoading(true);
      try {
        const res = await api.get("/locations", {
          params: { warehouseId: Number(filterWarehouseId) },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setFilterLocations(list);

        if (filterLocationId && !list.some((l) => String(l.id) === String(filterLocationId))) {
          setFilterLocationId("");
        }
      } catch (e) {
        toast.error(`Erro ao carregar locais do filtro: ${extractApiError(e)}`);
        setFilterLocations([]);
        setFilterLocationId("");
      } finally {
        setFilterLocationsLoading(false);
      }
    })();
  }, [filterWarehouseId]);

  const filterLocationMap = useMemo(() => {
    const map = new Map();
    (filterLocations || []).forEach((l) => map.set(Number(l.id), `${l.code} — ${l.name}`));
    return map;
  }, [filterLocations]);

  const locLabel = (warehouseId, locationId) => {
    if (filterWarehouseId && String(filterWarehouseId) === String(warehouseId)) {
      return filterLocationMap.get(Number(locationId)) || (locationId ? `LOC ${locationId}` : "-");
    }
    return locationId ? `LOC ${locationId}` : "-";
  };

  // material labels
  const materialMap = useMemo(() => {
    const map = new Map();
    (materials || []).forEach((m) => {
      map.set(
        Number(m.id),
        `${m.code ?? ""}${m.code ? " — " : ""}${m.name ?? ""}`.trim()
      );
    });
    return map;
  }, [materials]);

  const materialLabel = (id) => materialMap.get(Number(id)) || (id ? `ID ${id}` : "-");

  // movimentos filtrados por material (como já era)
  const filteredMoves = useMemo(() => {
    const id = Number(materialId);
    return (moves || []).filter((mv) => Number(mv.materialId) === id);
  }, [moves, materialId]);

  // saldo filtrado por warehouse/local
  const filteredStock = useMemo(() => {
    return (stock || []).filter((r) => {
      if (filterWarehouseId && String(r.warehouseId) !== String(filterWarehouseId)) return false;
      if (filterLocationId && String(r.locationId) !== String(filterLocationId)) return false;
      return true;
    });
  }, [stock, filterWarehouseId, filterLocationId]);

  const totalOnHand = useMemo(() => {
    return filteredStock.reduce((sum, r) => sum + Number(r.onHand || 0), 0);
  }, [filteredStock]);

  const stockByWarehouse = useMemo(() => {
    const map = new Map();
    (filteredStock || []).forEach((r) => {
      const whId = Number(r.warehouseId);
      const qty = Number(r.onHand || 0);
      map.set(whId, (map.get(whId) || 0) + qty);
    });
    return Array.from(map.entries()).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  }, [filteredStock]);

  const fmtQty = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "-";
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const fmtDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso).replace("T", " ").slice(0, 19);
    return d.toLocaleString("pt-BR");
  };

  const getWarehouseLabel = (warehouseId) => {
    return warehouseMap.get(Number(warehouseId)) || (warehouseId ? `WH ${warehouseId}` : "-");
  };

  const getLocationLabel = (warehouseId, locationId) => {
    if (!locationId) return "-";

    const wh = Number(warehouseId);
    const loc = Number(locationId);

    const list = locationsByWarehouse[wh];
    if (Array.isArray(list)) {
      const found = list.find((x) => Number(x.id) === loc);
      if (found) return `${found.code} — ${found.name}`;
    }

    return `LOC ${locationId}`;
  };

  const resetStockFilters = () => {
    setFilterWarehouseId("");
    setFilterLocationId("");
    setFilterLocations([]);
  };

  function csvEscape(value) {
    const s = value == null ? "" : String(value);
    return `"${s.replace(/"/g, '""')}"`;
  }

  function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function buildSaldoCsv({ materialLabel, filterWarehouseLabel, filterLocationLabel, rows, fmtQty }) {
    const headerLines = [
      ["Relatório", "Saldo (On Hand)"].map(csvEscape).join(","),
      ["Material", materialLabel].map(csvEscape).join(","),
      ["Armazém", filterWarehouseLabel || "Todos"].map(csvEscape).join(","),
      ["Local", filterLocationLabel || "Todos"].map(csvEscape).join(","),
      ["Gerado em", new Date().toLocaleString("pt-BR")].map(csvEscape).join(","),
      "",
    ].join("\n");

    const columns = ["Armazém", "Local", "On Hand"].map(csvEscape).join(",");
    const body = (rows || [])
      .map((r) => [r.warehouse, r.location, fmtQty(r.onHand)].map(csvEscape).join(","))
      .join("\n");

    return `${headerLines}\n${columns}\n${body}\n`;
  }

  function buildMovimentosCsv({ materialLabel, filterWarehouseLabel, filterLocationLabel, rows, fmtQty, fmtDate }) {
    const headerLines = [
      ["Relatório", "Movimentos"].map(csvEscape).join(","),
      ["Material", materialLabel].map(csvEscape).join(","),
      ["Armazém", filterWarehouseLabel || "Todos"].map(csvEscape).join(","),
      ["Local", filterLocationLabel || "Todos"].map(csvEscape).join(","),
      ["Gerado em", new Date().toLocaleString("pt-BR")].map(csvEscape).join(","),
      "",
    ].join("\n");

    const columns = ["ID", "Data", "Tipo", "Armazém", "Local", "Qtd", "Obs"].map(csvEscape).join(",");
    const body = (rows || [])
      .map((m) =>
        [
          m.id,
          fmtDate(m.createdAt),
          m.type || m.movementType || "",
          m.warehouse,
          m.location,
          fmtQty(m.qty),
          m.note || "",
        ].map(csvEscape).join(",")
      )
      .join("\n");

    return `${headerLines}\n${columns}\n${body}\n`;
  }

  function printHtml({ title, htmlBody }) {
    const iframe = document.createElement("iframe");

    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      .meta { font-size: 12px; color: #444; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; }
      th { background: #f3f3f3; text-align: left; }
      .right { text-align: right; }
      .section { margin-top: 18px; }
    </style>
  </head>
  <body>
    ${htmlBody}
  </body>
  </html>`);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }

  const exportSaldoRows = useMemo(() => {
    return (filteredStock || []).map((r) => ({
      warehouse: getWarehouseLabel(r.warehouseId),
      location: getLocationLabel(r.warehouseId, r.locationId),
      onHand: Number(r.onHand || 0),
    }));
  }, [filteredStock, getWarehouseLabel, getLocationLabel]);

  const exportMovRows = useMemo(() => {
    return (filteredMoves || []).map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      type: m.type || m.movementType,
      warehouse: getWarehouseLabel(m.warehouseId),
      location: getLocationLabel(m.warehouseId, m.locationId),
      qty: Number(m.qty || 0),
      note: m.note || "",
    }));
  }, [filteredMoves, getWarehouseLabel, getLocationLabel]);

  const filterWarehouseLabel = filterWarehouseId ? getWarehouseLabel(filterWarehouseId) : "";
  const filterLocationLabel = filterLocationId
    ? getLocationLabel(filterWarehouseId || 0, filterLocationId)
    : "";

  const handleExportSaldoCsv = () => {
    if (!materialId) return toast.error("Selecione um material.");
    const csv = buildSaldoCsv({
      materialLabel: materialLabel(materialId),
      filterWarehouseLabel,
      filterLocationLabel,
      rows: exportSaldoRows,
      fmtQty,
    });

    const safeMat = String(materialLabel(materialId)).replace(/[^\w\-]+/g, "_");
    downloadTextFile(`saldo_${safeMat}.csv`, csv, "text/csv;charset=utf-8");
    toast.success("CSV de saldo gerado!");
  };

  const handleExportMovCsv = () => {
    if (!materialId) return toast.error("Selecione um material.");
    const csv = buildMovimentosCsv({
      materialLabel: materialLabel(materialId),
      filterWarehouseLabel,
      filterLocationLabel,
      rows: exportMovRows,
      fmtQty,
      fmtDate,
    });

    const safeMat = String(materialLabel(materialId)).replace(/[^\w\-]+/g, "_");
    downloadTextFile(`movimentos_${safeMat}.csv`, csv, "text/csv;charset=utf-8");
    toast.success("CSV de movimentos gerado!");
  };

  const handlePrintReport = () => {
    if (!materialId) return toast.error("Selecione um material.");

    const meta = `
      <div class="meta">
        <div><b>Material:</b> ${materialLabel(materialId)}</div>
        <div><b>Armazém:</b> ${filterWarehouseLabel || "Todos"}</div>
        <div><b>Local:</b> ${filterLocationLabel || "Todos"}</div>
        <div><b>Gerado em:</b> ${new Date().toLocaleString("pt-BR")}</div>
      </div>
    `;

    const saldoTable = `
      <div class="section">
        <h1>Relatório de Saldo</h1>
        ${meta}
        <table>
          <thead>
            <tr>
              <th>Armazém</th>
              <th>Local</th>
              <th class="right">On Hand</th>
            </tr>
          </thead>
          <tbody>
            ${
              exportSaldoRows.length === 0
                ? `<tr><td colspan="3">Sem dados.</td></tr>`
                : exportSaldoRows
                    .map(
                      (r) => `
                      <tr>
                        <td>${r.warehouse}</td>
                        <td>${r.location}</td>
                        <td class="right">${fmtQty(r.onHand)}</td>
                      </tr>
                    `
                    )
                    .join("")
            }
          </tbody>
        </table>
        <div class="meta" style="margin-top:10px;"><b>Saldo total:</b> ${fmtQty(totalOnHand)}</div>
      </div>
    `;

    const movTable = `
      <div class="section">
        <h1>Relatório de Movimentos</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Tipo</th>
              <th>Armazém</th>
              <th>Local</th>
              <th class="right">Qtd</th>
              <th>Obs</th>
            </tr>
          </thead>
          <tbody>
            ${
              exportMovRows.length === 0
                ? `<tr><td colspan="7">Sem dados.</td></tr>`
                : exportMovRows
                    .map(
                      (m) => `
                      <tr>
                        <td>${m.id}</td>
                        <td>${fmtDate(m.createdAt)}</td>
                        <td>${m.type || ""}</td>
                        <td>${m.warehouse}</td>
                        <td>${m.location}</td>
                        <td class="right">${fmtQty(m.qty)}</td>
                        <td>${(m.note || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
                      </tr>
                    `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    `;

    printHtml({
      title: "Relatório — Estoque MVP",
      htmlBody: `${saldoTable}${movTable}`,
    });

    if (!ok) toast.error("Pop-up bloqueado. Permita pop-ups para imprimir.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Estoque — Consulta por Material
          </h1>
          <p className="mt-1 text-white/90">
            Visão por armazém e local.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtro de material */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Material
              </label>

              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
                value={materialId || 0}
                onChange={(e) => setMaterialId(Number(e.target.value || 0))}
                disabled={materialsLoading}
              >
                {materialsLoading && <option value={0}>Carregando...</option>}
                {!materialsLoading && materials.length === 0 && (
                  <option value={0}>Nenhum material cadastrado</option>
                )}
                {!materialsLoading &&
                  materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
              </select>
            </div>

            <Button
              onClick={() => refresh({ silent: true })}
              disabled={loading || refreshing || !materialId}
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>

          {errorMsg && (
            <div className="mt-3">
              <StateBlock
                state="error"
                title="Falha ao carregar dados"
                description={errorMsg}
                action={<Button onClick={() => refresh({ silent: false })}>Tentar novamente</Button>}
              />
            </div>
          )}
        </section>

        {/* filtros de saldo por WH/LOC */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExportSaldoCsv}>
              Exportar saldo (CSV)
            </Button>

            <Button variant="secondary" onClick={handleExportMovCsv}>
              Exportar movimentos (CSV)
            </Button>

            <Button onClick={handlePrintReport}>
              Imprimir / PDF
            </Button>

            <Button
              variant="secondary"
              onClick={resetStockFilters}
              disabled={!filterWarehouseId && !filterLocationId}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <Field label="Armazém">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                value={filterWarehouseId}
                onChange={(e) => {
                  setFilterWarehouseId(e.target.value);
                  setFilterLocationId("");
                }}
                disabled={warehousesLoading}
              >
                <option value="">
                  {warehousesLoading ? "Carregando..." : "— Todos —"}
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Local">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                value={filterLocationId}
                onChange={(e) => setFilterLocationId(e.target.value)}
                disabled={!filterWarehouseId || filterLocationsLoading}
              >
                <option value="">
                  {!filterWarehouseId
                    ? "Selecione um armazém"
                    : filterLocationsLoading
                    ? "Carregando..."
                    : "— Todos —"}
                </option>
                {filterLocations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.code} — {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="text-xs text-slate-600">
              Saldo total (aplicando filtros)
            </div>

            <div className="text-2xl font-semibold text-slate-800">
              {fmtQty(totalOnHand)}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Material: <span className="font-semibold">{materialLabel(materialId)}</span>
            </div>
          </div>

        </section>

        {/* resumo por armazém */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Saldo por Armazém
          </h2>

          {loading && !errorMsg ? (
            <StateBlock state="loading" title="Calculando saldos..." />
          ) : !materialId ? (
            <StateBlock state="empty" title="Selecione um material" />
          ) : stockByWarehouse.length === 0 ? (
            <StateBlock
              state="empty"
              title="Sem saldo"
              description="Nenhum saldo encontrado para os filtros atuais."
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Armazém</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockByWarehouse.map(([whId, qty]) => (
                    <TableRow key={whId}>
                      <TableCell>{whLabel(whId)}</TableCell>
                      <TableCell className="text-right">{fmtQty(qty)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setFilterWarehouseId(String(whId));
                            setFilterLocationId("");
                          }}
                        >
                          Ver locais
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Saldos por Local (agora filtrável) */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Saldos por Local
            </h2>
            <div className="text-xs text-slate-500">
              {filterWarehouseId ? (
                <>
                  Armazém: <span className="font-semibold">{whLabel(filterWarehouseId)}</span>
                  {filterLocationId ? (
                    <>
                      {" "}• Local: <span className="font-semibold">{locLabel(filterWarehouseId, filterLocationId)}</span>
                    </>
                  ) : null}
                </>
              ) : (
                "Todos os armazéns"
              )}
            </div>
          </div>

          {loading && !errorMsg ? (
            <StateBlock state="loading" title="Carregando saldos..." />
          ) : !materialId ? (
            <StateBlock
              state="empty"
              title="Selecione um material"
              description="Escolha um material acima para visualizar saldos e movimentos."
            />
          ) : filteredStock.length === 0 ? (
            <StateBlock
              state="empty"
              title="Sem saldo para este material"
              description="Nenhum registro de on-hand encontrado para os filtros atuais."
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Armazém</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{whLabel(r.warehouseId)}</TableCell>
                      <TableCell>{getWarehouseLabel(r.warehouseId)}</TableCell>
                      <TableCell>{getLocationLabel(r.warehouseId, r.locationId)}</TableCell>
                      <TableCell className="text-right">{fmtQty(r.onHand)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Ações (mantidas) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Devolução */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Devolução</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Armazém">
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                  value={retForm.warehouseId}
                  onChange={(e) =>
                    setRetForm((f) => ({
                      ...f,
                      warehouseId: e.target.value,
                      locationId: "",
                    }))
                  }
                  disabled={warehousesLoading || warehouses.length === 0}
                >
                  <option value="">
                    {warehousesLoading ? "Carregando..." : "— Selecione —"}
                  </option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={String(w.id)}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Local">
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                  value={retForm.locationId}
                  onChange={(e) => setRetForm((f) => ({ ...f, locationId: e.target.value }))}
                  disabled={!retForm.warehouseId || locationsLoading}
                >
                  <option value="">
                    {!retForm.warehouseId
                      ? "Selecione o armazém"
                      : locationsLoading
                      ? "Carregando..."
                      : "— Selecione —"}
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.code} — {l.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantidade">
                <Input
                  type="number"
                  step="0.0001"
                  value={retForm.qty}
                  onChange={(e) =>
                    setRetForm((f) => ({ ...f, qty: Number(e.target.value || 0) }))
                  }
                />
              </Field>

              <Field label="Observação">
                <Input
                  value={retForm.note}
                  onChange={(e) => setRetForm((f) => ({ ...f, note: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Button
                disabled={!materialId || submittingReturn}
                onClick={async () => {
                  if (!materialId) return toast.error("Selecione um material.");
                  if (!retForm.warehouseId || !retForm.locationId)
                    return toast.error("Selecione Armazém e Local.");
                  if (!retForm.qty || Number(retForm.qty) === 0)
                    return toast.error("Quantidade não pode ser 0.");

                  try {
                    setSubmittingReturn(true);
                    await postReturn({
                      materialId,
                      warehouseId: Number(retForm.warehouseId),
                      locationId: Number(retForm.locationId),
                      qty: Number(retForm.qty),
                      note: retForm.note || "",
                    });
                    toast.success("Devolução registrada!");
                    await refresh({ silent: true });
                  } catch (e) {
                    toast.error(extractApiError(e));
                  } finally {
                    setSubmittingReturn(false);
                  }
                }}
              >
                {submittingReturn ? "Registrando..." : "Registrar devolução"}
              </Button>
            </div>
          </div>

          {/* Transferência */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Transferência (por código)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Armazém">
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                  value={trfForm.warehouseId}
                  onChange={(e) =>
                    setTrfForm((f) => ({
                      ...f,
                      warehouseId: e.target.value,
                      fromLocationCode: "",
                      toLocationCode: "",
                    }))
                  }
                  disabled={warehousesLoading || warehouses.length === 0}
                >
                  <option value="">
                    {warehousesLoading ? "Carregando..." : "— Selecione —"}
                  </option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={String(w.id)}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Origem (Local)">
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                  value={trfForm.fromLocationCode}
                  onChange={(e) => setTrfForm((f) => ({ ...f, fromLocationCode: e.target.value }))}
                  disabled={!trfForm.warehouseId || locationsLoading}
                >
                  <option value="">
                    {!trfForm.warehouseId
                      ? "Selecione o armazém"
                      : locationsLoading
                      ? "Carregando..."
                      : "— Selecione —"}
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={String(l.code || "")}>
                      {l.code} — {l.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Destino (Local)">
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition disabled:opacity-70"
                  value={trfForm.toLocationCode}
                  onChange={(e) => setTrfForm((f) => ({ ...f, toLocationCode: e.target.value }))}
                  disabled={!trfForm.warehouseId || locationsLoading}
                >
                  <option value="">
                    {!trfForm.warehouseId
                      ? "Selecione o armazém"
                      : locationsLoading
                      ? "Carregando..."
                      : "— Selecione —"}
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={String(l.code || "")}>
                      {l.code} — {l.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantidade">
                <Input
                  type="number"
                  step="0.0001"
                  value={trfForm.qty}
                  onChange={(e) => setTrfForm((f) => ({ ...f, qty: Number(e.target.value || 0) }))}
                />
              </Field>

              <Field label="Observação" className="md:col-span-2">
                <Input
                  value={trfForm.note}
                  onChange={(e) => setTrfForm((f) => ({ ...f, note: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Button
                disabled={!materialId || submittingTransfer}
                onClick={async () => {
                  if (!materialId) return toast.error("Selecione um material.");
                  if (!trfForm.warehouseId) return toast.error("Selecione o Armazém.");
                  if (!trfForm.fromLocationCode || !trfForm.toLocationCode)
                    return toast.error("Selecione os locais de origem e destino.");
                  if (!trfForm.qty || Number(trfForm.qty) <= 0)
                    return toast.error("Quantidade deve ser maior que 0.");

                  if (trfForm.fromLocationCode === trfForm.toLocationCode) {
                    return toast.error("Origem e destino não podem ser o mesmo local.");
                  }

                  try {
                    setSubmittingTransfer(true);
                    await postTransferByCode({
                      materialId,
                      warehouseId: Number(trfForm.warehouseId),
                      fromLocationCode: String(trfForm.fromLocationCode),
                      toLocationCode: String(trfForm.toLocationCode),
                      qty: Number(trfForm.qty),
                      note: trfForm.note || "",
                    });
                    toast.success("Transferência registrada!");
                    await refresh({ silent: true });
                  } catch (e) {
                    toast.error(extractApiError(e));
                  } finally {
                    setSubmittingTransfer(false);
                  }
                }}
              >
                {submittingTransfer ? "Transferindo..." : "Transferir"}
              </Button>
            </div>
          </div>
        </section>

        {/* Movimentos (mantido) */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Últimos movimentos — {materialLabel(materialId)}
            </h2>
            <Button
              variant="ghost"
              onClick={() => refresh({ silent: true })}
              disabled={loading || refreshing || !materialId}
            >
              Atualizar
            </Button>
          </div>

          {loading && !errorMsg ? (
            <StateBlock state="loading" title="Carregando movimentos..." />
          ) : !materialId ? (
            <StateBlock
              state="empty"
              title="Selecione um material"
              description="Escolha um material acima para ver os movimentos."
            />
          ) : filteredMoves.length === 0 ? (
            <StateBlock
              state="empty"
              title="Sem movimentos"
              description="Não há movimentos recentes para este material."
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>WH</TableHead>
                    <TableHead>Loc</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Obs</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMoves.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>
                        <MovementBadge type={m.type || m.movementType} />
                      </TableCell>
                      <TableCell>{getWarehouseLabel(m.warehouseId)}</TableCell>
                      <TableCell>{getLocationLabel(m.warehouseId, m.locationId)}</TableCell>
                      <TableCell className="text-right">{fmtQty(m.qty)}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={m.note}>
                        {m.note || "-"}
                      </TableCell>
                      <TableCell>{fmtDate(m.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
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
