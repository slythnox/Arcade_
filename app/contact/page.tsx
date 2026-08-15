"use client";

import React, { useState } from "react";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      router.push("/thank-you");
    } catch {
      router.push("/thank-you");
    }
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail items={[{ label: "CONTACT" }]} />

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ marginBottom: "30px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "20px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: "var(--arcade-pink)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            ✦ DISPATCH & FEEDBACK TERMINAL
          </span>
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "26px",
              fontWeight: 900,
              color: "#FFFFFF",
              marginTop: "10px",
              marginBottom: "8px",
            }}
          >
            DISPATCH TERMINAL
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-dim)" }}>
            Send engine feedback, report simulation edge cases, or propose new game cartridges.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(4, 6, 12, 0.5)",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-yellow)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              CALLSIGN / NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pilot42"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                backgroundColor: "var(--color-surface-elevated)",
                color: "var(--color-text)",
                border: "1px solid var(--color-surface-border)",
                borderRadius: "6px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-cyan)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              COMM LINK / EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@arcade.games"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                backgroundColor: "var(--color-surface-elevated)",
                color: "var(--color-text)",
                border: "1px solid var(--color-surface-border)",
                borderRadius: "6px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                color: "var(--arcade-pink)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              TRANSMISSION / MESSAGE
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message or game proposal here..."
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                backgroundColor: "var(--color-surface-elevated)",
                color: "var(--color-text)",
                border: "1px solid var(--color-surface-border)",
                borderRadius: "6px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px",
              background: "linear-gradient(180deg, #ff5c8a 0%, #ff3b77 100%)",
              color: "#ffffff",
              fontFamily: "var(--font-pixel)",
              fontSize: "12px",
              fontWeight: 900,
              borderRadius: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(255, 92, 138, 0.4)",
              marginTop: "8px",
            }}
          >
            <Send size={15} />
            <span>{isSubmitting ? "TRANSMITTING..." : "TRANSMIT DISPATCH"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
