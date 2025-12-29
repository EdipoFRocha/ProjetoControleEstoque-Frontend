import { UNIT_OPTIONS } from "@/constants/units";

export default function UnitSelect({
  value,
  onChange,
  disabled = false,
  className = "",
  label = "Unidade *",
  hint = "",
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>

      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={
          "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none " +
          "focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition disabled:opacity-70 " +
          className
        }
      >
        <option value="">Selecione...</option>
        {UNIT_OPTIONS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>

      {!!hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
