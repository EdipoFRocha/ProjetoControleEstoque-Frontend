import { useCallback, useEffect, useMemo, useState } from "react";
import { api, extractApiError } from "@/api/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/EmptyState";
import StateBlock from "@/components/ui/StateBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SearchPanel from "@/components/ui/SearchPanel";
import MaterialQrModal from "@/components/ui/MaterialQrModal";
import UnitSelect from "@/components/ui/UnitSelect";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [qrMaterial, setQrMaterial] = useState(null);

  const filteredMaterials = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (materials || []).filter((m) => {
      const code = String(m.code || "").toLowerCase();
      const name = String(m.name || "").toLowerCase();
      const sku = String(m.sku || "").toLowerCase();

      if (!query) return true;
      return code.includes(query) || name.includes(query) || sku.includes(query);
    });
  }, [materials, q]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    unit: "KG",
    description: "",
    salePrice: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const loadMaterials = useCallback(async (opts = { silent: false }) => {
    const silent = !!opts?.silent;

    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/materials");
      setMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar materiais", err);
      toast.error(`Falha ao carregar materiais: ${extractApiError(err)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials({ silent: false });
  }, [loadMaterials]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const code = form.code.trim();
    const name = form.name.trim();

    if (!code || !name) {
      toast.error("Preencha código e nome do material.");
      return;
    }

    const salePriceRaw = String(form.salePrice ?? "").trim();

    const salePriceValue =
      salePriceRaw === ""
        ? null
        : Number(salePriceRaw.replace(",", "."));

    if (salePriceValue != null) {
      if (Number.isNaN(salePriceValue)) {
        toast.error("Preço de venda inválido.");
        return;
      }

      if (salePriceValue < 0) {
        toast.error("Preço não pode ser negativo.");
        return;
      }

      if (salePriceValue > 9999999.99) {
        toast.error("Preço muito alto. Máximo permitido: 9.999.999,99");
        return;
      }

      const validFormat = /^\d+([.,]\d{1,2})?$/.test(salePriceRaw);
      if (!validFormat) {
        toast.error("Use no máximo 2 casas decimais (ex.: 10,50).");
        return;
      }
    }

    try {
      setSubmitting(true);

      const salePriceValue =
        form.salePrice === "" || form.salePrice == null
          ? null
          : Number(String(form.salePrice).replace(",", "."));

      if (salePriceValue != null && (Number.isNaN(salePriceValue) || salePriceValue < 0)) {
        toast.error("Preço de venda inválido.");
        return;
      }

      const payload = {
        code,
        name,
        unit: form.unit?.trim() || null,
        description: form.description?.trim() || null,
        salePrice: salePriceValue,
      };

      if (editingId) {
        await api.put(`/materials/${editingId}`, payload);
        toast.success("Material atualizado com sucesso!");
      } else {
        await api.post("/materials", payload);
        toast.success("Material cadastrado com sucesso!");
      }

      toast.success("Material cadastrado com sucesso!");

      setEditingId(null);
      setForm((prev) => ({
        code: "",
        name: "",
        unit: prev.unit || "KG",
        description: "",
        salePrice: "",
      }));

      await loadMaterials({ silent: true });
    } catch (err) {
      console.error("Erro ao salvar material", err);
      toast.error(`Falha ao salvar material: ${extractApiError(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const countLabel = useMemo(() => {
    return (materials?.length || 0).toString();
  }, [materials]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">
            Cadastro de Materiais
          </h1>
          <p className="mt-1 text-white/90 text-center">
            Defina os produtos que serão movimentados no estoque.
          </p>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* FORMULÁRIO */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Novo material</h2>
              <p className="text-sm text-slate-500 mt-1">
                Cadastre código, nome e unidade.
              </p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Código <span className="text-rose-600">*</span>
              </label>
              <Input
                name="code"
                value={form.code}
                onChange={onChange}
                placeholder="Ex.: CU-8MM, PROD-001..."
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nome <span className="text-rose-600">*</span>
              </label>
              <Input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder='Ex.: Cobre 8mm, Barra Aço 1"...'
                disabled={submitting}
              />
            </div>

            <div>
              <UnitSelect
                value={form.unit}
                onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Preço de venda (R$)
              </label>

              <input
                name="salePrice"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="9999999.99"
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                placeholder="Ex.: 12.50"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none
                           focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Descrição (opcional)
              </label>
              <Input
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Detalhes do produto, uso, especificações..."
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      code: "",
                      name: "",
                      unit: "KG",
                      description: "",
                      salePrice: "",
                    });
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Salvando..."
                  : editingId
                  ? "Salvar alterações"
                  : "Salvar material"}
              </Button>
            </div>
          </form>
        </section>

        {/* Painel de busca */}
        <SearchPanel
          value={q}
          onChange={setQ}
          placeholder="Buscar por código, nome ou SKU"
        />

        {/* LISTA */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold">Materiais cadastrados</h2>
              <p className="text-sm text-slate-500">
                Total:{" "}
                <span className="font-medium text-slate-900">{countLabel}</span>
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMaterials({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? "Atualizando..." : "Recarregar"}
            </Button>
          </div>

          {loading ? (
            <StateBlock state="loading" title="Carregando materiais..." />
          ) : materials.length === 0 ? (
            <EmptyState
              title="Nenhum material cadastrado"
              description="Cadastre seu primeiro material para começar a movimentar estoque."
              actionLabel="Criar material"
              onAction={() => {
                const el = document.querySelector('input[name="code"]');
                el?.focus?.();
              }}
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="whitespace-nowrap">Un.</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>

                      <TableCell>
                        <div className="font-medium">
                          {m.code} — {m.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          SKU:{" "}
                          <span className="font-mono">
                            {m.sku || "-"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {m.unit || "-"}
                      </TableCell>

                      <TableCell className="max-w-[320px] truncate" title={m.description}>
                        {m.description || "-"}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        {m.salePrice != null
                          ? `R$ ${Number(m.salePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>

                      {/*  Botões */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setQrMaterial(m)}
                            disabled={!m.sku}
                            title={!m.sku ? "Material sem SKU" : "Abrir QR Code"}
                          >
                            Ver QR
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(m.id);
                              setForm({
                                code: m.code || "",
                                name: m.name || "",
                                unit: m.unit || "KG",
                                description: m.description || "",
                                salePrice: m.salePrice != null ? String(m.salePrice) : "",
                              });
                              toast.success(`Editando: ${m.code}`);
                            }}
                          >
                            Editar
                          </Button>

                          {/*  Desativa não exclui! */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const ok = window.confirm(`Excluir o material ${m.code} — ${m.name}?`);
                              if (!ok) return;

                              try {
                                await api.delete(`/materials/${m.id}`);
                                toast.success("Material excluído!");

                                if (editingId === m.id) {
                                  setEditingId(null);
                                  setForm({
                                    code: "",
                                    name: "",
                                    unit: "KG",
                                    description: "",
                                    salePrice: "",
                                  });
                                }

                                await loadMaterials({ silent: true });
                              } catch (err) {
                                toast.error(`Falha ao excluir: ${extractApiError(err)}`);
                              }
                            }}
                            disabled={submitting || editingId === m.id}
                          >
                            Excluir
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!m.sku) return;
                              navigator.clipboard.writeText(m.sku);
                              toast.success("SKU copiado!");
                            }}
                            disabled={!m.sku || submitting}
                          >
                            Copiar SKU
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/*  Modal do QR */}
        {qrMaterial && (
          <MaterialQrModal
            material={qrMaterial}
            onClose={() => setQrMaterial(null)}
          />
        )}
      </main>
    </div>
  );
}
