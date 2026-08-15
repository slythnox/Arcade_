import React from "react";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { faqs } from "@/data/faq";

export const metadata: Metadata = constructSiteMetadata({
  title: "Frequently Asked Questions — ARCADE_",
  description:
    "Everything you need to know about ARCADE_, touch controls, browser compatibility, custom game engine, and sound synthesis.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail items={[{ label: "FAQ" }]} />

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: "var(--arcade-yellow)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            ✦ SYSTEM FAQ & COMPATIBILITY
          </span>
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginTop: "12px",
              marginBottom: "10px",
              lineHeight: 1.25,
            }}
          >
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-dim)" }}>
            Common questions regarding mechanics, technology, offline storage, and browser compatibility.
          </p>
        </div>

        <FAQAccordion items={faqs} />
      </div>
    </div>
  );
}
