import React from "react";

export function Separator({ className = "", ...props }) {
    return <hr className={`border-t border-slate-200 ${className}`} {...props} />;
}
