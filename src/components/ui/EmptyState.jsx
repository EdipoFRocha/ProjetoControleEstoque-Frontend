export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
