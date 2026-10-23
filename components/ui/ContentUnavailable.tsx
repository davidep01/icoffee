import type { LucideIcon } from "lucide-react";

/** Stato vuoto, come ContentUnavailableView. */
export function ContentUnavailable({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col items-center px-8 py-16 text-center">
      <Icon className="size-14 text-label-3" strokeWidth={1.6} aria-hidden />
      <h2 className="mt-4 text-title-3">{title}</h2>
      <p className="mt-1 text-subhead text-label-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
