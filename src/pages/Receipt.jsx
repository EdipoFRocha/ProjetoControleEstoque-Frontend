import { useState } from "react";
import { PackagePlus, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/api/api";
import LoadingButton from "@/components/ui/LoadingButton";

export default function Receipt() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                        <PackagePlus className="w-7 h-7" />
                        Estoque — Recebimento
                    </h1>
                    <p className="mt-1 text-white/90">
                        Registro de entrada de materiais
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                <FormCard />
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-slate-500">
                Dica: <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd> navega entre campos •
                <span className="mx-1" /> <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Shift</kbd> +{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Tab</kbd> volta •
                <span className="mx-1" /> <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border">Enter</kbd> envia
            </footer>
        </div>
    );
}

function FormCard() {
    const [form, setForm] = useState({
        nfNumber: "",
        invoiceItemId: "",
        materialId: "",
        qty: "",
        warehouseId: "",
        locationId: "",
        note: "",
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const reset = () =>
        setForm({
            nfNumber: "",
            invoiceItemId: "",
            materialId: "",
            qty: "",
            warehouseId: "",
            locationId: "",
            note: "",
        });

    const validate = () => {
        if (!form.nfNumber?.trim()) return "Informe o número da NF.";
        const isNum = (v) => v !== "" && !isNaN(Number(v));
        if (!isNum(form.invoiceItemId)) return "Invoice Item ID inválido.";
        if (!isNum(form.materialId)) return "Material ID inválido.";
        if (!isNum(form.qty) || Number(form.qty) <= 0) return "Quantidade deve ser maior que 0.";
        if (!isNum(form.warehouseId)) return "Warehouse ID inválido.";
        if (!isNum(form.locationId)) return "Location ID inválido.";
        return null;
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
            const payload = {
                nfNumber: form.nfNumber.trim(),
                invoiceItemId: Number(form.invoiceItemId),
                materialId: Number(form.materialId),
                qty: Number(form.qty),
                warehouseId: Number(form.warehouseId),
                locationId: Number(form.locationId),
                note: form.note ?? "",
            };
            const res = await api.post("/receipts", payload, {
                headers: { "Content-Type": "application/json" },
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setErrorMsg(
                err?.response?.data?.message || err?.message || "Erro ao comunicar com a API"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-medium tracking-tight">Registrar Recebimento</h2>
                <p className="text-sm text-slate-500 mt-0.5"></p>
            </div>

            <form onSubmit={send} className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        id="nfNumber"
                        label="Número da NF"
                        value={form.nfNumber}
                        onChange={onChange}
                        placeholder="Ex.: NF-2025-0001"
                    />

                    <Field
                        id="invoiceItemId"
                        label="Item da Nota"
                        value={form.invoiceItemId}
                        onChange={onChange}
                        inputProps={{ type: "number", min: 1, step: 1 }}
                        placeholder="Ex.: 1"
                    />

                    <Field
                        id="materialId"
                        label="Material ID"
                        value={form.materialId}
                        onChange={onChange}
                        inputProps={{ type: "number", min: 1, step: 1 }}
                        placeholder="Ex.: 1"
                    />

                    <Field
                        id="qty"
                        label="Quantidade"
                        value={form.qty}
                        onChange={onChange}
                        inputProps={{ type: "number", min: 0, step: "0.001" }}
                        placeholder="Ex.: 50"
                    />

                    <Field
                        id="warehouseId"
                        label="Armazém"
                        value={form.warehouseId}
                        onChange={onChange}
                        inputProps={{ type: "number", min: 1, step: 1 }}
                        placeholder="Ex.: 1"
                    />

                    <Field
                        id="locationId"
                        label="Localização"
                        value={form.locationId}
                        onChange={onChange}
                        inputProps={{ type: "number", min: 1, step: 1 }}
                        placeholder="Ex.: 1"
                    />

                    <div className="md:col-span-2">
                        <label
                            htmlFor="note"
                            className="block text-xs font-medium text-slate-600 mb-1"
                        >
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

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-3">
                    <LoadingButton
                        isLoading={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow"
                        icon={<PackagePlus className="w-4 h-4" />}
                        loadingIcon={<Loader2 className="w-4 h-4 animate-spin" />}
                        loadingText="Enviando…"
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
                        <div>
                            <div className="font-medium">Sucesso</div>
                            <pre className="text-xs mt-1 text-emerald-900/90">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

function Field({ id, label, value, onChange, placeholder, inputProps = {} }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="flex items-center gap-2 text-sm text-slate-700"
            >
                {label}
            </label>
            <input
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"
                {...inputProps}
            />
        </div>
    );
}
