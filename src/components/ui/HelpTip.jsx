// src/components/ui/HelpTip.jsx
import { useId } from "react";

export default function HelpTip({ text, className = "" }) {
    const id = useId();
    return (
        <span className={`relative inline-flex items-center group ${className}`} aria-describedby={id}>
      <button
          type="button"
          className="w-5 h-5 rounded-full text-[11px] font-bold grid place-items-center
                   bg-slate-200 text-slate-700 hover:bg-slate-300"
          aria-label="Ajuda"
          title={text} // fallback nativo
          tabIndex={0}
      >
        ?
      </button>
            {/* Tooltip custom: aparece no hover/focus */}
            <span
                id={id}
                role="tooltip"
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 mt-2 w-64
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                   transition bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow z-50"
            >
        {text}
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900" />
      </span>
    </span>
    );
}
