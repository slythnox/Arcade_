import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "amber" | "muted" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "green",
  size = "sm",
}) => {
  const variantColors: Record<string, { bg: string; text: string; border: string }> = {
    green: {
      bg: "rgba(74, 222, 128, 0.15)",
      text: "var(--color-green)",
      border: "var(--color-green-dark)",
    },
    amber: {
      bg: "rgba(229, 178, 93, 0.15)",
      text: "var(--color-warning)",
      border: "var(--color-warning)",
    },
    muted: {
      bg: "var(--color-surface-elevated)",
      text: "var(--color-text-dim)",
      border: "var(--color-surface-border)",
    },
    outline: {
      bg: "transparent",
      text: "var(--color-green-bright)",
      border: "var(--color-green)",
    },
  };

  const style = variantColors[variant] || variantColors.green;
  const isSm = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: isSm ? "2px 8px" : "4px 12px",
        fontSize: isSm ? "11px" : "12px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: "var(--border-radius-pixel)",
      }}
    >
      {children}
    </span>
  );
};
