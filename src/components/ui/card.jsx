import React from "react";

export function Card({ className = "", ...props }) {
    return <div className={`bg-white rounded-xl shadow-sm ring-1 ring-slate-200 ${className}`} {...props} />;
}
export function CardHeader({ className = "", ...props }) {
    return <div className={`p-4 border-b border-slate-200 ${className}`} {...props} />;
}
export function CardTitle({ className = "", ...props }) {
    return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}
export function CardDescription({ className = "", ...props }) {
    return <p className={`text-slate-500 text-sm ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }) {
    return <div className={`p-4 ${className}`} {...props} />;
}
