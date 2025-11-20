import React from "react";

export function Textarea({ className = "", ...props }) {
    return (
        <textarea
            className={`w-full px-3 py-2 rounded-md border border-slate-300 outline-none focus:ring-2 focus:ring-black/20 ${className}`}
            {...props}
        />
    );
}
