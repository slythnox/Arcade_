import React from "react";

export interface CRTOverlayProps {
  children: React.ReactNode;
  enabled?: boolean;
  scanlines?: boolean;
  flicker?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({
  children,
  style = {},
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050914",
        border: "2px solid #1a2a4a",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(4, 8, 18, 0.8), 0 0 20px rgba(77, 232, 232, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* 100% Clean Crisp Canvas with No Scanline Pollution */}
      {children}
    </div>
  );
};
