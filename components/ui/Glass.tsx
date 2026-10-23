import type { ComponentProps, ElementType } from "react";

type GlassProps<T extends ElementType> = {
  as?: T;
  strong?: boolean;
} & ComponentProps<T>;

/** Superficie Liquid Glass: traslucida, con bordo luminoso e riflesso speculare. */
export function Glass<T extends ElementType = "div">({ as, strong, className = "", ...props }: GlassProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={`glass ${strong ? "glass-strong" : ""} ${className}`} {...props} />;
}
