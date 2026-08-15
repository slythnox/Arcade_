"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.15s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "var(--border-width) solid transparent",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "10px 18px", fontSize: "14px" },
    lg: { padding: "14px 28px", fontSize: "16px" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--color-green)",
      color: "#050705",
      borderColor: "var(--color-green-bright)",
      boxShadow: "var(--shadow-pixel)",
    },
    secondary: {
      backgroundColor: "var(--color-surface-elevated)",
      color: "var(--color-text)",
      borderColor: "var(--color-surface-border)",
      boxShadow: "var(--shadow-pixel-sm)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--color-green)",
      borderColor: "var(--color-green)",
      boxShadow: "var(--shadow-pixel-sm)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-text-dim)",
      borderColor: "transparent",
    },
    danger: {
      backgroundColor: "var(--color-danger)",
      color: "#FFFFFF",
      borderColor: "#FCA5A5",
      boxShadow: "var(--shadow-pixel)",
    },
  };

  return (
    <button
      className={`arcade-btn arcade-btn-${variant} arcade-btn-${size} ${className}`}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      disabled={disabled}
      {...props}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </button>
  );
};
