import type { ElementType, ReactNode } from "react";

/**
 * Shared page container: centered, max 1200px, with responsive gutters.
 * Replaces the repeated `mx-auto max-w-[1200px] px-6` wrapper.
 */
export default function Container({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`mx-auto max-w-[1200px] px-4 sm:px-6 ${className}`}>
      {children}
    </Tag>
  );
}