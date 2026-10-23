import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

type Variant = "filled" | "tinted" | "glass" | "plain" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  filled: "bg-accent text-on-accent shadow-[0_6px_20px_-6px_var(--accent)] hover:brightness-105",
  tinted: "bg-accent-soft text-accent hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]",
  glass: "glass text-label",
  plain: "text-accent hover:bg-fill",
  destructive: "bg-red-soft text-red",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-subhead gap-1.5 rounded-full",
  md: "h-11 px-5 text-headline gap-2 rounded-full",
  lg: "h-[52px] px-6 text-headline gap-2 rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = "filled",
  size = "md",
  icon: Icon,
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`glass-button inline-flex shrink-0 select-none items-center justify-center font-semibold disabled:opacity-45 disabled:active:scale-100 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-[1.1em] animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="size-[1.1em]" strokeWidth={2.2} aria-hidden />
      )}
      {children}
    </button>
  );
}

/** Bottone tondo con sola icona: target minimo 44pt come da HIG. */
export function IconButton({
  icon: Icon,
  label,
  active,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`glass-button inline-flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
        active ? "bg-accent text-on-accent" : "glass text-label"
      } ${className}`}
      {...props}
    >
      <Icon className="size-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
