import React from "react";

export function Button({
  as: As = "button",
  className = "",
  variant = "default",
  size = "default",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition " +
    "disabled:opacity-50 disabled:pointer-events-none active:scale-[.99]";

  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent",
    secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 border border-transparent hover:bg-slate-100",
    outline: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 border border-transparent",
  };

  const sizes = {
    default: "h-10 px-4",
    sm: "h-9 px-3 text-xs",
    icon: "h-10 w-10 p-0",
  };

  const Cmp = As;
  return (
    <Cmp
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    />
  );
}
