import React, { useMemo } from "react";

export function Select({ onValueChange, defaultValue, children }) {
    const items = useMemo(() => {
        const flat = [];
        const walk = (nodes) => {
            React.Children.forEach(nodes, (child) => {
                if (!child) return;
                if (child.type && child.type.displayName === "SelectItem") {
                    flat.push(child);
                } else if (child.props && child.props.children) {
                    walk(child.props.children);
                }
            });
        };
        walk(children);
        return flat;
    }, [children]);

    return (
        <select
            defaultValue={defaultValue}
            onChange={(e) => onValueChange?.(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-black/20"
        >
            <option value="" disabled hidden>Selecione…</option>
            {items.map((it) => (
                <option key={it.props.value} value={it.props.value}>
                    {it.props.children}
                </option>
            ))}
        </select>
    );
}

export function SelectTrigger({ children }) { return <>{children}</>; }
export function SelectValue({ children, placeholder }) { return <span>{children || placeholder}</span>; }
export function SelectContent({ children }) { return <>{children}</>; }

export function SelectItem({ value, children }) { return <option value={value}>{children}</option>; }
SelectItem.displayName = "SelectItem";
