import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { getAllCaseStudies } from "@/data/caseStudies";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import { ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = constructSiteMetadata({
  title: "Engineering Case Studies — Engine & Algorithms",
  description:
    "Explore in-depth technical case studies on custom game engine architecture, deterministic simulations, and discrete mathematics.",
  path: "/case-studies",
});

export default function CaseStudiesPage() {
  const studies = getAllCaseStudies();

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail items={[{ label: "CASE STUDIES" }]} />

      <div style={{ maxWidth: "800px", marginBottom: "var(--space-10)" }}>
        <span
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            color: "var(--arcade-cyan)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          ✦ TECHNICAL DOCUMENTATION & RESEARCH
        </span>
        <h1
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 900,
            color: "#FFFFFF",
            marginTop: "12px",
            marginBottom: "12px",
            lineHeight: 1.25,
          }}
        >
          ENGINEERING CASE STUDIES
        </h1>
        <p style={{ fontSize: "15px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
          Deep technical explorations of deterministic simulation loops, 2D matrix transformations, and multi-criteria fuzzy search algorithms underpinning ARCADE_.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(320px, 30vw, 480px), 1fr))", gap: "24px", maxWidth: "min(1200px, 100%)" }}>
        {studies.map((study, idx) => {
          const cardAccents = ["#ff5c8a", "#4de8e8", "#ffd84d", "#a879ff"];
          const accent = cardAccents[idx % cardAccents.length];

          return (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              style={{
                backgroundColor: "var(--color-surface)",
                border: `1px solid ${accent}44`,
                borderRadius: "8px",
                padding: "28px",
                textDecoration: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 8px 24px rgba(4, 6, 12, 0.5)",
              }}
              className="case-study-card"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 900,
                    fontSize: "12px",
                    color: accent,
                    backgroundColor: `${accent}18`,
                    border: `1px solid ${accent}55`,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  STUDY #{study.number}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <Clock size={14} />
                  <span>{study.readTime}</span>
                </div>
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "8px",
                }}
              >
                {study.title}
              </h2>

              <p style={{ fontSize: "14px", color: "var(--color-text-dim)", lineHeight: 1.6, marginBottom: "18px" }}>
                {study.summary}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {study.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      padding: "3px 8px",
                      backgroundColor: "var(--color-surface-elevated)",
                      color: "var(--color-text-dim)",
                      border: "1px solid var(--color-surface-border)",
                      borderRadius: "3px",
                    }}
                  >
                    {t}
                  </span>
                ))}

                <span
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: accent,
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  <span>READ STUDY</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
