import React from "react";

export function Input({ className = "", ...props }) {
    return (
        <input
            className={`w-full h-10 px-3 rounded-md border border-slate-300 outline-none focus:ring-2 focus:ring-black/20 ${className}`}
            {...props}
        />
    );
}
