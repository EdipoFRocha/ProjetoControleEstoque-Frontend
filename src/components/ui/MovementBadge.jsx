const MAP = {
  RECEIPT: { label: "Recebimento", cls: "bg-sky-100 text-sky-700" },
  SALE: { label: "Venda", cls: "bg-emerald-100 text-emerald-700" },
  RETURN: { label: "Devolução", cls: "bg-indigo-100 text-indigo-700" },
  TRANSFER_OUT: { label: "Transf. Saída", cls: "bg-amber-100 text-amber-700" },
  TRANSFER_IN: { label: "Transf. Entrada", cls: "bg-amber-100 text-amber-700" },
  ADJUSTMENT_IN: { label: "Ajuste +", cls: "bg-emerald-100 text-emerald-700" },
  ADJUSTMENT_OUT: { label: "Ajuste -", cls: "bg-rose-100 text-rose-700" },
};

function normalizeType(t) {
  if (!t) return "";
  return String(t)
    .trim()
    .toUpperCase()
    .replace(/^TYPE_/, "")
    .replace(/^MOVEMENT_/, "")
    .replace(/\s+/g, "_");
}

export default function MovementBadge({ type, movementType }) {
  const key = normalizeType(type || movementType);
  const info = MAP[key] || { label: key || "-", cls: "bg-slate-100 text-slate-700" };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cls}`}
      title={key}
    >
      {info.label}
    </span>
  );
}
