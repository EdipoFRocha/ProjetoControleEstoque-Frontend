import { Loader2, AlertCircle, Inbox } from "lucide-react";

export default function StateBlock({
  state, // "loading" | "error" | "empty"
  title,
  description,
  action,
}) {
  const Icon =
    state === "loading" ? Loader2 : state === "error" ? AlertCircle : Inbox;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 grid place-items-center">
        <Icon className={`w-5 h-5 ${state === "loading" ? "animate-spin" : ""}`} />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">
        {title || (state === "loading" ? "Carregando..." : state === "error" ? "Erro" : "Sem dados")}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
