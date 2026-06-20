import type { ReactNode } from "react";
import "./badge.scss";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "ai";

type BadgeProps = Readonly<{
  text: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}>;

export default function Badge({
  text,
  variant = "default",
  icon,
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()}>
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__text">{text}</span>
    </span>
  );
}