import { useEffect, useState } from "react";
import { getStock, getMovements, postReturn, postTransferByCode } from "../api/stock";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export default function Inventory() {
    const [materialId, setMaterialId] = useState(1);
    const [stock, setStock] = useState([]);
    const [moves, setMoves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    // forms
    const [retForm, setRetForm] = useState({
        warehouseId: 1,
        locationId: 1,
        qty: 10,
        note: "Devolução UI",
    });

    const [trfForm, setTrfForm] = useState({
        warehouseId: 1,
        fromLocationCode: "LOC-1",
        toLocationCode: "LOC-2",
        qty: 5,
        note: "Transfer UI",
    });

    async function refresh() {
        setMsg("");
        setLoading(true);
        try {
            const [s, m] = await Promise.all([
                getStock(materialId).then((r) => r.data),
                getMovements({
                    types: "RECEIPT,SALE,RETURN,TRANSFER_OUT,TRANSFER_IN,ADJUSTMENT_IN,ADJUSTMENT_OUT",
                    limit: 20,
                }).then((r) => r.data),
            ]);
            setStock(s || []);
            setMoves(m || []);
        } catch (e) {
            setMsg(String(e?.response?.data?.message || e?.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh(); // carregamento inicial
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* HEADER AZUL IGUAL ÀS OUTRAS TELAS */}
            <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                        Estoque — Material
                    </h1>
                    <p className="mt-1 text-white/90">
                        Consulta de saldos, devoluções e transferências
                    </p>
                </div>
            </header>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Filtro material */}
                <div className="flex gap-3 items-end mb-6">
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Material ID</label>
                        <Input
                            type="number"
                            value={materialId}
                            onChange={(e) => setMaterialId(Number(e.target.value || 0))}
                        />
                    </div>
                    <Button onClick={refresh} disabled={loading}>
                        {loading ? "Carregando..." : "Atualizar"}
                    </Button>
                    {msg && <div className="text-sm text-red-600">{msg}</div>}
                </div>

                {/* SALDO */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4 mb-8">
                    <h2 className="font-semibold mb-3">Saldos por Local</h2>
                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">On Hand</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stock.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Sem saldo para este material.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {stock.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{r.warehouseId}</TableCell>
                                        <TableCell>{r.locationId}</TableCell>
                                        <TableCell className="text-right">
                                            {Number(r.onHand).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* AÇÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* DEVOLUÇÃO */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
                        <h3 className="font-semibold mb-3">Devolução</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Warehouse ID">
                                <Input
                                    type="number"
                                    value={retForm.warehouseId}
                                    onChange={(e) =>
                                        setRetForm((f) => ({
                                            ...f,
                                            warehouseId: Number(e.target.value || 0),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Location ID">
                                <Input
                                    type="number"
                                    value={retForm.locationId}
                                    onChange={(e) =>
                                        setRetForm((f) => ({
                                            ...f,
                                            locationId: Number(e.target.value || 0),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Quantidade">
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={retForm.qty}
                                    onChange={(e) =>
                                        setRetForm((f) => ({
                                            ...f,
                                            qty: Number(e.target.value || 0),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Observação">
                                <Input
                                    value={retForm.note}
                                    onChange={(e) =>
                                        setRetForm((f) => ({
                                            ...f,
                                            note: e.target.value,
                                        }))
                                    }
                                />
                            </Field>
                        </div>
                        <div className="mt-3">
                            <Button
                                onClick={async () => {
                                    try {
                                        await postReturn({ materialId, ...retForm });
                                        await refresh();
                                        alert("Devolução registrada!");
                                    } catch (e) {
                                        alert(
                                            "Erro: " +
                                                (e?.response?.data?.message ||
                                                    e?.message ||
                                                    e)
                                        );
                                    }
                                }}
                            >
                                Registrar devolução
                            </Button>
                        </div>
                    </div>

                    {/* TRANSFERÊNCIA por CÓDIGO */}
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
                        <h3 className="font-semibold mb-3">Transferência (por código)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Warehouse ID">
                                <Input
                                    type="number"
                                    value={trfForm.warehouseId}
                                    onChange={(e) =>
                                        setTrfForm((f) => ({
                                            ...f,
                                            warehouseId: Number(e.target.value || 0),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="De (code)">
                                <Input
                                    value={trfForm.fromLocationCode}
                                    onChange={(e) =>
                                        setTrfForm((f) => ({
                                            ...f,
                                            fromLocationCode: e.target.value,
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Para (code)">
                                <Input
                                    value={trfForm.toLocationCode}
                                    onChange={(e) =>
                                        setTrfForm((f) => ({
                                            ...f,
                                            toLocationCode: e.target.value,
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Quantidade">
                                <Input
                                    type="number"
                                    step="0.0001"
                                    value={trfForm.qty}
                                    onChange={(e) =>
                                        setTrfForm((f) => ({
                                            ...f,
                                            qty: Number(e.target.value || 0),
                                        }))
                                    }
                                />
                            </Field>
                            <Field label="Observação" className="col-span-2">
                                <Input
                                    value={trfForm.note}
                                    onChange={(e) =>
                                        setTrfForm((f) => ({
                                            ...f,
                                            note: e.target.value,
                                        }))
                                    }
                                />
                            </Field>
                        </div>
                        <div className="mt-3">
                            <Button
                                onClick={async () => {
                                    try {
                                        await postTransferByCode({ materialId, ...trfForm });
                                        await refresh();
                                        alert("Transferência registrada!");
                                    } catch (e) {
                                        alert(
                                            "Erro: " +
                                                (e?.response?.data?.message ||
                                                    e?.message ||
                                                    e)
                                        );
                                    }
                                }}
                            >
                                Transferir
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MOVIMENTOS */}
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">Últimos movimentos</h2>
                        <Button variant="ghost" onClick={refresh}>
                            Atualizar
                        </Button>
                    </div>
                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Material</TableHead>
                                    <TableHead>WH</TableHead>
                                    <TableHead>Loc</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Obs</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moves.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8}>Sem movimentos.</TableCell>
                                    </TableRow>
                                )}
                                {moves.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.id}</TableCell>
                                        <TableCell>{m.type}</TableCell>
                                        <TableCell>{m.materialId}</TableCell>
                                        <TableCell>{m.warehouseId}</TableCell>
                                        <TableCell>{m.locationId ?? "-"}</TableCell>
                                        <TableCell className="text-right">{m.qty}</TableCell>
                                        <TableCell
                                            className="max-w-[280px] truncate"
                                            title={m.note}
                                        >
                                            {m.note || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {m.createdAt
                                                ?.replace("T", " ")
                                                .substring(0, 19)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Field({ label, className = "", children }) {
    return (
        <div className={className}>
            <label className="block text-xs text-slate-600 mb-1">
                {label}
            </label>
            {children}
        </div>
    );
}
