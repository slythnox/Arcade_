import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ThankYouPage() {
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
          maxWidth: "500px",
          margin: "0 auto",
          backgroundColor: "var(--color-surface)",
          border: "var(--border-width) solid var(--color-green)",
          boxShadow: "var(--shadow-pixel-green)",
          padding: "40px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--color-green)" }}>
          <CheckCircle2 size={48} />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "22px",
            fontWeight: 900,
            color: "var(--color-text)",
            marginBottom: "12px",
          }}
        >
          TRANSMISSION RECEIVED
        </h1>

        <p style={{ fontSize: "14px", color: "var(--color-text-dim)", lineHeight: 1.6, marginBottom: "24px" }}>
          Your dispatch has been successfully recorded into the ARCADE_ subsystem logs. Thank you for your feedback!
        </p>

        <Link
          href="/games"
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
          <span>RETURN TO ARCADE</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
