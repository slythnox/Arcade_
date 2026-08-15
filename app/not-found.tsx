import React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="container"
      style={{
        paddingTop: "var(--space-16)",
        paddingBottom: "var(--space-16)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          backgroundColor: "var(--color-surface)",
          border: "4px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-pixel-green)",
          padding: "48px 32px",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--color-warning)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "12px",
          }}
        >
          ⚠ HARDWARE EXCEPTION
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(56px, 10vw, 84px)",
            fontWeight: 900,
            color: "var(--color-green-bright)",
            lineHeight: 1,
            marginBottom: "16px",
            letterSpacing: "0.05em",
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "18px",
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: "12px",
          }}
        >
          CARTRIDGE NOT INSERTED
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-dim)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          The requested memory address or game sector does not exist in the ARCADE_ registry.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "var(--color-green)",
              color: "#050705",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "13px",
              textTransform: "uppercase",
              border: "2px solid var(--color-green-bright)",
              boxShadow: "var(--shadow-pixel)",
              textDecoration: "none",
            }}
          >
            <RotateCcw size={14} />
            <span>REBOOT ARCADE</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
