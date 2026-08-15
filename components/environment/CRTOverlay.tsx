import React from "react";

export interface CRTOverlayProps {
  children: React.ReactNode;
  enabled?: boolean;
  scanlines?: boolean;
  flicker?: boolean;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({
  children,
  enabled = true,
  scanlines = true,
  flicker = false,
}) => {
  if (!enabled) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`crt-frame ${flicker ? "crt-flicker" : ""}`}
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
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
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
            opacity: 0.45,
          }}
        />
      )}

      {/* Game Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};
