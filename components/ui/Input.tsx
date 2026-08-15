import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  clearButton?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, clearButton, onClear, className = "", style = {}, ...props }, ref) => {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {icon && (
          <div
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-green)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`arcade-input ${className}`}
          style={{
            width: "100%",
            padding: icon ? "12px 14px 12px 42px" : "12px 14px",
            fontSize: "15px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            border: "var(--border-width) solid var(--color-surface-border)",
            boxShadow: "var(--shadow-pixel-sm)",
            fontFamily: "var(--font-mono)",
            outline: "none",
            ...style,
          }}
          {...props}
        />
        {clearButton && props.value && onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
