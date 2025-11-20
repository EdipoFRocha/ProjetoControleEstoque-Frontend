import { useState } from "react";
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
} from "lucide-react";
import { api } from "@/api/api";
import LoadingButton from "@/components/ui/LoadingButton";

export default function Sales() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                        <FileText className="w-7 h-7" />
                        Pedido de Venda — Saída
                    </h1>
                    <p className="mt-1 text-white/90">
                        Monte o pedido de venda com os itens desejados.
                    </p>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                <SalesOrderForm />
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-slate-500">
                Use{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd> para navegar •{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Enter</kbd> para registrar o pedido
            </footer>
        </div>
    );
}

function SalesOrderForm() {
    // Cabeçalho do pedido + dados do cliente
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

    // Itens do pedido
    const [items, setItems] = useState([
        {
            id: 1,
            materialId: "",
            qty: "",
            warehouseId: "",
            locationId: "",
            unitPrice: "",
        },
    ]);

    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const onHeaderChange = (e) =>
        setHeader((h) => ({
            ...h,
            [e.target.name]: e.target.value,
        }));

    const onItemChange = (id, field, value) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                materialId: "",
                qty: "",
                warehouseId: "",
                locationId: "",
                unitPrice: "",
            },
        ]);
    };

    const removeItem = (id) => {
        setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.id !== id)));
    };

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
        setItems([
            {
                id: 1,
                materialId: "",
                qty: "",
                warehouseId: "",
                locationId: "",
                unitPrice: "",
            },
        ]);
        setNote("");
        setResult(null);
        setErrorMsg("");
    };

    const isNum = (v) => v !== "" && !isNaN(Number(v));

    const validate = () => {
        if (!header.customerDocument.trim())
            return "Informe o documento do cliente (CNPJ/CPF).";

        if (!header.customerName.trim())
            return "Cliente sem nome. Busque um cliente válido pelo CPF/CNPJ ou informe o nome.";

        const validItems = items.filter((i) => i.materialId || i.qty || i.warehouseId || i.locationId);
        if (validItems.length === 0) return "Adicione pelo menos 1 item ao pedido.";

        for (const [index, item] of validItems.entries()) {
            const linha = index + 1;
            if (!isNum(item.materialId)) return `Linha ${linha}: informe um Material ID válido.`;
            if (!isNum(item.qty) || Number(item.qty) <= 0)
                return `Linha ${linha}: a quantidade deve ser maior que 0.`;
            if (!isNum(item.warehouseId)) return `Linha ${linha}: informe um Armazém válido.`;
            if (!isNum(item.locationId)) return `Linha ${linha}: informe uma Localização válida.`;
        }

        return null;
    };

    const subtotal = items.reduce((acc, item) => {
        const qty = Number(item.qty);
        const price = Number(item.unitPrice);
        if (!isNaN(qty) && !isNaN(price)) {
            return acc + qty * price;
        }
        return acc;
    }, 0);

    const handlePrint = () => {
        window.print();
    };

    const fetchCustomer = async () => {
        if (!header.customerDocument.trim()) return;

        setCustomerLoading(true);
        setErrorMsg("");
        try {
            const res = await api.get("/customers/by-document", {
                params: { document: header.customerDocument.trim() },
            });
            const c = res.data;
            if (!c) {
                setErrorMsg("Cliente não encontrado para o documento informado.");
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
        } catch (err) {
            console.error(err);
            setErrorMsg(
                err?.response?.data?.message ||
                err?.message ||
                "Erro ao buscar cliente"
            );
        } finally {
            setCustomerLoading(false);
        }
    };

    const send = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setResult(null);

        const err = validate();
        if (err) {
            setErrorMsg(err);
            return;
        }

        setLoading(true);

        try {
            const effectiveItems = items.filter(
                (i) => i.materialId && i.qty && i.warehouseId && i.locationId
            );

            const orderMeta = `Cliente: ${header.customerName} | Doc: ${
                header.customerDocument
            } | Pedido: ${header.orderNumber || "-"} | Condição: ${
                header.paymentTerms || "-"
            } | Endereço: ${header.addressLine || ""}, ${header.number || ""} - ${
                header.district || ""
            } - ${header.city || ""}/${header.state || ""} CEP ${header.zipCode || ""} | Obs: ${
                note || "-"
            }`;

            const responses = [];
            for (const item of effectiveItems) {
                const payload = {
                    materialId: Number(item.materialId),
                    qty: Number(item.qty),
                    warehouseId: Number(item.warehouseId),
                    locationId: Number(item.locationId),
                    note: orderMeta,
                };

                const res = await api.post("/sales", payload, {
                    headers: { "Content-Type": "application/json" },
                });
                responses.push(res.data);
            }

            setResult({
                message: `Pedido registrado com ${effectiveItems.length} item(ns).`,
                responses,
            });
        } catch (err) {
            console.error(err);
            setErrorMsg(
                err?.response?.data?.message ||
                err?.message ||
                "Erro ao comunicar com a API"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200" id="print-area">
            <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-medium tracking-tight">Pedido de Venda (Saída de Estoque)</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Preencha os dados do cliente e os itens do pedido. Cada item será baixado via FIFO.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-[.99]"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir pedido
                    </button>
                </div>
            </div>

            <form onSubmit={send} className="p-5 space-y-6">
                {/* Cabeçalho / Cliente */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <User2 className="w-4 h-4" />
                            Dados do Cliente
                        </h3>
                        <button
                            type="button"
                            onClick={fetchCustomer}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 active:scale-[.99]"
                        >
                            {customerLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <User2 className="w-3 h-3" />
                            )}
                            Buscar cliente por CPF/CNPJ
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            CPF / CNPJ *
                        </label>
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
                        label="Número do Pedido (interno)"
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

                    {/* Endereço do cliente */}
                    <div className="md:col-span-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2">
                        <p className="text-xs font-semibold text-slate-600">
                            Endereço do Cliente (usado no pedido impresso)
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Rua / Logradouro
                                </label>
                                <input
                                    name="addressLine"
                                    value={header.addressLine}
                                    onChange={onHeaderChange}
                                    placeholder="Preenchido a partir do cadastro de clientes"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Número
                                </label>
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
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Bairro
                                </label>
                                <input
                                    name="district"
                                    value={header.district}
                                    onChange={onHeaderChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Cidade
                                </label>
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
                                    <input
                                        name="state"
                                        value={header.state}
                                        onChange={onHeaderChange}
                                        placeholder="UF"
                                        className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                    />
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

                {/* Itens do pedido */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Itens do Pedido
                        </h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 active:scale-[.99]"
                        >
                            <Plus className="w-3 h-3" />
                            Adicionar item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="border border-slate-200 rounded-xl p-3 bg-slate-50/70"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-600">
                                        Item {index + 1}
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Remover
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Material ID
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={item.materialId}
                                            onChange={(e) =>
                                                onItemChange(item.id, "materialId", e.target.value)
                                            }
                                            placeholder="Ex.: 1"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Quantidade
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.001"
                                            value={item.qty}
                                            onChange={(e) =>
                                                onItemChange(item.id, "qty", e.target.value)
                                            }
                                            placeholder="Ex.: 50"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Armazém
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={item.warehouseId}
                                            onChange={(e) =>
                                                onItemChange(item.id, "warehouseId", e.target.value)
                                            }
                                            placeholder="Ex.: 1"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Localização
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={item.locationId}
                                            onChange={(e) =>
                                                onItemChange(item.id, "locationId", e.target.value)
                                            }
                                            placeholder="Ex.: 1"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Preço unitário (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) =>
                                                onItemChange(item.id, "unitPrice", e.target.value)
                                            }
                                            placeholder="Ex.: 35,90"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Observações e resumo */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Observações do Pedido
                        </label>
                        <textarea
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex.: Entregar em 48h, frete CIF, contato João..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition"
                        />
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/80 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                            Resumo Financeiro
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium">
                                R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                            * O valor aqui é apenas referência visual. Neste momento, somente o movimento de
                            estoque (FIFO) é registrado na API.
                        </p>
                    </div>
                </section>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-3">
                    <LoadingButton
                        isLoading={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                        icon={<ArrowDownCircle className="w-4 h-4" />}
                        loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
                        loadingText="Processando pedido…"
                    >
                        Registrar pedido (venda FIFO)
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
                        <div>
                            <div className="font-medium">Sucesso</div>
                            <p className="text-sm mt-0.5">{result.message}</p>
                            <pre className="text-[11px] mt-2 text-emerald-900/90 overflow-auto max-h-48">
                                {JSON.stringify(result.responses, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

function LabeledInput({ label, name, value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
                {label}
            </label>
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
