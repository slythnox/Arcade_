import React from "react";

export interface CRTOverlayProps {
  children: React.ReactNode;
  enabled?: boolean;
  scanlines?: boolean;
  flicker?: boolean;
  aspectRatio?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({
  children,
  enabled = true,
  scanlines = true,
  flicker = false,
  aspectRatio = "600 / 700",
  style = {},
  className = "",
}) => {
  if (!enabled) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          aspectRatio: aspectRatio === "fill" ? "auto" : aspectRatio,
          width: aspectRatio === "fill" ? "100%" : "auto",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`crt-frame ${flicker ? "crt-flicker" : ""} ${className}`}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050914",
        border: "2px solid #1a2a4a",
        borderRadius: "6px",
        boxShadow: "0 8px 32px rgba(4, 8, 18, 0.8), 0 0 16px rgba(77, 232, 232, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        aspectRatio: aspectRatio === "fill" ? "auto" : aspectRatio,
        width: aspectRatio === "fill" ? "100%" : "auto",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Subtle Vignette Gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 75%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      {/* Subtle Neutral Raster Scanlines (No green cast) */}
      {scanlines && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(18, 22, 34, 0) 50%, rgba(0, 0, 0, 0.22) 50%)",
            backgroundSize: "100% 4px",
            pointerEvents: "none",
            zIndex: 5,
            opacity: 0.8,
          }}
        />
      )}

      {/* Content Canvas */}
      {children}
    </div>
  );
};
