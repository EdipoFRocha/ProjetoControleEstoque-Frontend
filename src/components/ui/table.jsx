import React from "react";

export function Table({ className = "", ...props }) {
    return <table className={`w-full text-sm ${className}`} {...props} />;
}
export function TableHeader({ className = "", ...props }) {
    return <thead className={`bg-slate-50 ${className}`} {...props} />;
}
export function TableBody({ className = "", ...props }) {
    return <tbody className={className} {...props} />;
}
export function TableRow({ className = "", ...props }) {
    return <tr className={`border-b last:border-0 ${className}`} {...props} />;
}
export function TableHead({ className = "", ...props }) {
    return <th className={`text-left font-medium text-slate-600 px-3 py-2 ${className}`} {...props} />;
}
export function TableCell({ className = "", ...props }) {
    return <td className={`px-3 py-2 align-top ${className}`} {...props} />;
}
