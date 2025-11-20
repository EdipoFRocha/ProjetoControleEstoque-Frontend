import React from "react";

export function Button({ as: As = "button", className = "", variant = "default", size = "default", ...props }) {
    const base =
        "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
        default: "bg-black text-white border-transparent hover:opacity-90",
        secondary: "bg-white text-black border border-slate-300 hover:bg-slate-50",
        ghost: "bg-transparent border-transparent hover:bg-slate-100",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10 p-0",
    };
    const Cmp = As;
    return <Cmp className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
