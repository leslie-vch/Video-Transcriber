import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.scss";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    fullWidth?: boolean;
    loading?: boolean;
  }
>;

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const buttonClassName = [
    "button",
    `button--${variant}`,
    fullWidth ? "button--fullWidth" : "",
    loading ? "button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}

      <span className="button__text">
        {loading ? "Transcribiendo..." : children}
      </span>
    </button>
  );
}