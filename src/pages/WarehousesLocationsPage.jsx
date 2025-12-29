import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import StateBlock from "@/components/ui/StateBlock";
import { api, extractApiError } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function WarehousesLocationsPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loadingWh, setLoadingWh] = useState(true);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [err, setErr] = useState("");

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(0);

  // forms
  const [newWh, setNewWh] = useState({ code: "", name: "" });
  const [editWhId, setEditWhId] = useState(null);
  const [editWh, setEditWh] = useState({ code: "", name: "", active: true });

  const [newLoc, setNewLoc] = useState({ code: "", name: "" });
  const [editLocId, setEditLocId] = useState(null);
  const [editLoc, setEditLoc] = useState({ code: "", name: "", active: true });

  async function loadWarehouses() {
    setErr("");
    setLoadingWh(true);
    try {
      const res = await api.get("/warehouses");
      const list = Array.isArray(res.data) ? res.data : [];
      setWarehouses(list);

      if (!selectedWarehouseId && list.length > 0) {
        setSelectedWarehouseId(Number(list[0].id));
      }
    } catch (e) {
      setErr(extractApiError(e));
      toast.error(`Erro ao carregar armazéns: ${extractApiError(e)}`);
    } finally {
      setLoadingWh(false);
    }
  }

  async function loadLocations(warehouseId) {
    const wh = Number(warehouseId);
    if (!wh) {
      setLocations([]);
      return;
    }
    setLoadingLoc(true);
    try {
      const res = await api.get("/locations", { params: { warehouseId: wh } });
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(`Erro ao carregar locais: ${extractApiError(e)}`);
      setLocations([]);
    } finally {
      setLoadingLoc(false);
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadLocations(selectedWarehouseId);
  }, [selectedWarehouseId]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => Number(w.id) === Number(selectedWarehouseId)),
    [warehouses, selectedWarehouseId]
  );

  const onCreateWarehouse = async () => {
    if (!newWh.code.trim() || !newWh.name.trim()) {
      return toast.error("Informe code e name do armazém.");
    }
    try {
      const res = await api.post("/warehouses", {
        code: newWh.code.trim(),
        name: newWh.name.trim(),
      });
      toast.success("Armazém criado!");
      setNewWh({ code: "", name: "" });

      await loadWarehouses();
      if (res?.data?.id) setSelectedWarehouseId(Number(res.data.id));
    } catch (e) {
      toast.error(extractApiError(e));
    }
  };

  const startEditWarehouse = (w) => {
    setEditWhId(w.id);
    setEditWh({
      code: w.code ?? "",
      name: w.name ?? "",
      active: w.active ?? true,
    });
  };

  const onSaveWarehouse = async () => {
    if (!editWhId) return;
    try {
      const res = await api.put(`/warehouses/${editWhId}`, {
        code: editWh.code?.trim() || null,
        name: editWh.name?.trim() || null,
        active: editWh.active,
      });
      toast.success("Armazém atualizado!");
      setEditWhId(null);
      await loadWarehouses();
      if (res?.data?.id) setSelectedWarehouseId(Number(res.data.id));
    } catch (e) {
      toast.error(extractApiError(e));
    }
  };

  const onCreateLocation = async () => {
    const wh = Number(selectedWarehouseId);
    if (!wh) return toast.error("Selecione um armazém.");
    if (!newLoc.code.trim() || !newLoc.name.trim()) {
      return toast.error("Informe code e name do local.");
    }
    try {
      await api.post("/locations", {
        warehouseId: wh,
        code: newLoc.code.trim(),
        name: newLoc.name.trim(),
      });
      toast.success("Local criado!");
      setNewLoc({ code: "", name: "" });
      await loadLocations(wh);
    } catch (e) {
      toast.error(extractApiError(e));
    }
  };

  const startEditLocation = (l) => {
    setEditLocId(l.id);
    setEditLoc({
      code: l.code ?? "",
      name: l.name ?? "",
      active: l.active ?? true,
    });
  };

  const onSaveLocation = async () => {
    if (!editLocId) return;
    try {
      await api.put(`/locations/${editLocId}`, {
        code: editLoc.code?.trim() || null,
        name: editLoc.name?.trim() || null,
        active: editLoc.active,
      });
      toast.success("Local atualizado!");
      setEditLocId(null);
      await loadLocations(selectedWarehouseId);
    } catch (e) {
      toast.error(extractApiError(e));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Armazéns e Locais
          </h1>
          <p className="mt-1 text-white/90">
            Cadastre armazéns e locais para destravar saldo real por armazém/local.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {err ? (
          <StateBlock
            state="error"
            title="Falha ao carregar"
            description={err}
            action={<Button onClick={loadWarehouses}>Tentar novamente</Button>}
          />
        ) : null}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Armazéns */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Armazéns</h2>
              <Button variant="secondary" onClick={loadWarehouses} disabled={loadingWh}>
                {loadingWh ? "Carregando..." : "Recarregar"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Code">
                <Input value={newWh.code} onChange={(e) => setNewWh((f) => ({ ...f, code: e.target.value }))} />
              </Field>
              <Field label="Nome" className="md:col-span-2">
                <Input value={newWh.name} onChange={(e) => setNewWh((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <div className="md:col-span-3">
                <Button onClick={onCreateWarehouse}>Novo armazém</Button>
              </div>
            </div>

            {loadingWh ? (
              <StateBlock state="loading" title="Carregando armazéns..." />
            ) : warehouses.length === 0 ? (
              <StateBlock state="empty" title="Nenhum armazém" description="Crie o primeiro armazém acima." />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((w) => {
                      const selected = Number(w.id) === Number(selectedWarehouseId);
                      return (
                        <TableRow
                          key={w.id}
                          className={selected ? "bg-slate-50" : ""}
                          onClick={() => setSelectedWarehouseId(Number(w.id))}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell className="font-medium">{w.code}</TableCell>
                          <TableCell className="max-w-[280px] truncate" title={w.name}>
                            {w.name}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditWarehouse(w);
                              }}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {editWhId ? (
              <div className="rounded-xl border p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-700">Editar armazém (ID {editWhId})</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Code">
                    <Input value={editWh.code} onChange={(e) => setEditWh((f) => ({ ...f, code: e.target.value }))} />
                  </Field>
                  <Field label="Nome" className="md:col-span-2">
                    <Input value={editWh.name} onChange={(e) => setEditWh((f) => ({ ...f, name: e.target.value }))} />
                  </Field>
                  <Field label="Ativo">
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                      value={String(editWh.active)}
                      onChange={(e) => setEditWh((f) => ({ ...f, active: e.target.value === "true" }))}
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  </Field>
                </div>

                <div className="flex gap-2">
                  <Button onClick={onSaveWarehouse}>Salvar</Button>
                  <Button variant="secondary" onClick={() => setEditWhId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Locais */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Locais</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedWarehouse ? (
                    <>
                      Armazém selecionado: <span className="font-semibold">{selectedWarehouse.code}</span> —{" "}
                      <span className="font-semibold">{selectedWarehouse.name}</span>
                    </>
                  ) : (
                    "Selecione um armazém à esquerda."
                  )}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => loadLocations(selectedWarehouseId)}
                disabled={loadingLoc || !selectedWarehouseId}
              >
                {loadingLoc ? "Carregando..." : "Recarregar"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Code">
                <Input
                  value={newLoc.code}
                  onChange={(e) => setNewLoc((f) => ({ ...f, code: e.target.value }))}
                  disabled={!selectedWarehouseId}
                />
              </Field>
              <Field label="Nome" className="md:col-span-2">
                <Input
                  value={newLoc.name}
                  onChange={(e) => setNewLoc((f) => ({ ...f, name: e.target.value }))}
                  disabled={!selectedWarehouseId}
                />
              </Field>
              <div className="md:col-span-3">
                <Button onClick={onCreateLocation} disabled={!selectedWarehouseId}>
                  Novo local
                </Button>
              </div>
            </div>

            {!selectedWarehouseId ? (
              <StateBlock state="empty" title="Selecione um armazém" description="Escolha um armazém para ver os locais." />
            ) : loadingLoc ? (
              <StateBlock state="loading" title="Carregando locais..." />
            ) : locations.length === 0 ? (
              <StateBlock state="empty" title="Nenhum local" description="Crie o primeiro local acima." />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.code}</TableCell>
                        <TableCell className="max-w-[280px] truncate" title={l.name}>
                          {l.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" onClick={() => startEditLocation(l)}>
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {editLocId ? (
              <div className="rounded-xl border p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-700">Editar local (ID {editLocId})</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Code">
                    <Input value={editLoc.code} onChange={(e) => setEditLoc((f) => ({ ...f, code: e.target.value }))} />
                  </Field>
                  <Field label="Nome" className="md:col-span-2">
                    <Input value={editLoc.name} onChange={(e) => setEditLoc((f) => ({ ...f, name: e.target.value }))} />
                  </Field>
                  <Field label="Ativo">
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                      value={String(editLoc.active)}
                      onChange={(e) => setEditLoc((f) => ({ ...f, active: e.target.value === "true" }))}
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  </Field>
                </div>

                <div className="flex gap-2">
                  <Button onClick={onSaveLocation}>Salvar</Button>
                  <Button variant="secondary" onClick={() => setEditLocId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
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
