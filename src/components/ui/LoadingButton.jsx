// src/components/ui/LoadingButton.jsx
import { Loader2 } from "lucide-react";

export default function LoadingButton({
                                          isLoading,
                                          disabled,
                                          children,
                                          className = "",
                                          type = "submit",
                                          icon = null,
                                          loadingIcon = <Loader2 className="w-4 h-4 animate-spin" />,
                                          loadingText = "Enviando…",
                                          ...props
                                      }) {
    const base =
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium active:scale-[.99]";
    const disabledCls = (isLoading || disabled) ? "opacity-60 cursor-not-allowed" : "";

    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            aria-busy={isLoading ? "true" : "false"}
            className={`${base} ${disabledCls} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    {loadingIcon}
                    {loadingText}
                </>
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </button>
    );
}
