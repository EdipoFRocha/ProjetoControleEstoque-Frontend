export default function SearchPanel({
  value,
  onChange,
  placeholder = "Buscar...",
  right = null,
  footer = null,
  className = "",
}) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full md:max-w-md rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-500 transition"
        />

        {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </section>
  );
}
