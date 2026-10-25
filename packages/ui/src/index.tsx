import * as React from "react";

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500 shadow-sm",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-indigo-500 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
}) {
  const styles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={`animate-spin text-current ${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
