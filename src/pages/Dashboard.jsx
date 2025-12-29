import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { api, extractApiError } from "@/api/api";
import StateBlock from "@/components/ui/StateBlock";
import MovementBadge from "@/components/ui/MovementBadge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/ui/EmptyState";

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center">
          <Icon className="w-5 h-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
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

export default function Dashboard() {
  const [materialsCount, setMaterialsCount] = useState(0);
  const [moves, setMoves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const { user } = useAuth();
  const displayName = user?.fullName || user?.username || "usuário";
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (opts = { silent: false }) => {
    const silent = !!opts?.silent;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setErr("");
    try {
      // Total materiais
      const matsRes = await api.get("/master-data/materials");
      const mats = matsRes.data || [];
      setMaterialsCount(mats.length);

      // Últimos movimentos
      const movRes = await api.get("/movements", {
        params: {
          types: "RECEIPT,SALE,RETURN,TRANSFER_OUT,TRANSFER_IN,ADJUSTMENT_IN,ADJUSTMENT_OUT",
          limit: 50,
        },
      });

      setMoves(movRes.data || []);
      setLastUpdated(new Date());
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load({ silent: false });
  }, [load]);

  const todayCount = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return (moves || []).filter((mv) => {
      const dt = new Date(mv.createdAt);
      if (isNaN(dt.getTime())) return false;
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [moves]);

  const last10 = useMemo(() => {
    const arr = [...(moves || [])];
    arr.sort((a, b) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });
    return arr.slice(0, 10);
  }, [moves]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleString("pt-BR");
  }, [lastUpdated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                <LayoutDashboard className="w-7 h-7" />
                Dashboard
              </h1>

              <p className="mt-1 text-white/90">
                Bem-vindo, <span className="font-semibold">{displayName}</span>. Aqui está o resumo do seu estoque.
              </p>

              {lastUpdatedLabel && (
                <div className="mt-2 text-xs text-white/80">
                  Atualizado em: {lastUpdatedLabel}
                </div>
              )}
            </div>

            <Button
              onClick={() => load({ silent: true })}
              disabled={loading || refreshing}
              variant="secondary"
              className="bg-white/15 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {err ? (
          <StateBlock
            state="error"
            title="Falha ao carregar Dashboard"
            description={err}
            action={<Button onClick={() => load({ silent: false })}>Tentar novamente</Button>}
          />
        ) : loading ? (
          <StateBlock state="loading" title="Carregando indicadores..." />
        ) : (
          <>
            {/* Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Materiais cadastrados"
                value={materialsCount}
                subtitle="Catálogo de produtos do estoque"
                icon={Package}
              />
              <StatCard
                title="Movimentos hoje"
                value={todayCount}
                subtitle="Atividade registrada no dia"
                icon={ArrowLeftRight}
              />
              <StatCard
                title="Últimos movimentos"
                value={moves.length}
                subtitle="Janela de consulta (limit 50)"
                icon={Boxes}
              />
            </section>

            <section className="bg-white rounded-xl ring-1 ring-slate-200 p-4 text-sm text-slate-600">
              Este painel apresenta um resumo do estoque e das movimentações recentes.
              Utilize os botões de ação para registrar recebimentos, vendas e consultar saldos.
            </section>

            {/* Ações rápidas */}
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Ações rápidas</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Acesse rapidamente as principais operações do sistema.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate("/recebimento")}>Recebimento</Button>
                  <Button onClick={() => navigate("/venda")} variant="secondary">Vendas</Button>
                  <Button onClick={() => navigate("/estoque")} variant="secondary">Estoque</Button>
                  <Button onClick={() => navigate("/ajustes")} variant="ghost">Ajustes</Button>
                </div>
              </div>

              {/* Indicador leve quando está atualizando */}
              {refreshing && (
                <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Atualizando dados…
                </div>
              )}
            </section>

            {/* Tabela últimos 10 */}
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  Últimos 10 movimentos
                </h2>
              </div>

              {last10.length === 0 ? (
                <EmptyState
                  title="Sem movimentos ainda"
                  description="Quando houver recebimentos, vendas, devoluções, transferências ou ajustes, eles aparecerão aqui."
                  actionLabel="Registrar recebimento"
                  onAction={() => navigate("/recebimento")}
                />
              ) : (
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
                        <TableHead>Obs</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {last10.map((mv) => (
                        <TableRow key={mv.id}>
                          <TableCell>{mv.id}</TableCell>
                          <TableCell>
                            <MovementBadge type={mv.type || mv.movementType} />
                          </TableCell>
                          <TableCell
                            className="max-w-[280px] truncate"
                            title={`${mv.materialCode || ""} ${mv.materialName || ""}`.trim()}
                          >
                            {mv.materialCode ? `${mv.materialCode} — ${mv.materialName || ""}` : (mv.materialId ?? "-")}
                          </TableCell>
                          <TableCell>{mv.warehouseId ?? mv.warehouseCode ?? "-"}</TableCell>
                          <TableCell>{mv.locationId ?? mv.locationCode ?? "-"}</TableCell>
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
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
