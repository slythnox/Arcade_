import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  glow = false,
  className = "",
  style = {},
  ...props
}) => {
  const bg = variant === "elevated" ? "var(--color-surface-elevated)" : "var(--color-surface)";
  const shadow = glow ? "var(--shadow-pixel-green)" : "var(--shadow-pixel)";

  return (
    <div
      className={`arcade-card arcade-card-${variant} ${className}`}
      style={{
        backgroundColor: bg,
        border: "var(--border-width) solid var(--color-surface-border)",
        boxShadow: shadow,
        padding: "var(--space-6)",
        position: "relative",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
