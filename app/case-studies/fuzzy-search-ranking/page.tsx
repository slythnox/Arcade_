import React from "react";
import type { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = constructSiteMetadata({
  title: "Multi-Criteria Fuzzy Search with Levenshtein Distance — ARCADE_",
  description:
    "Engineering a sub-millisecond in-memory fuzzy search engine with space-optimized dynamic programming and multi-attribute weight polynomials.",
  path: "/case-studies/fuzzy-search-ranking",
});

export default function FuzzySearchRankingStudy() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail
        items={[
          { label: "CASE STUDIES", href: "/case-studies" },
          { label: "FUZZY SEARCH RANKING" },
        ]}
      />

      <article style={{ maxWidth: "840px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--arcade-pink)",
                backgroundColor: "rgba(255, 92, 138, 0.12)",
                border: "1px solid rgba(255, 92, 138, 0.3)",
                padding: "3px 10px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              ENGINE STUDY #03
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-dim)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              <Clock size={14} /> 6 min read
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginBottom: "14px",
              lineHeight: 1.25,
            }}
          >
            MULTI-CRITERIA FUZZY SEARCH ENGINE
          </h1>

          <p style={{ fontSize: "16px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            Designing a zero-dependency in-memory search pipeline capable of fuzzy edit-distance matching, metadata ranking, and tag filtering in under 1 millisecond.
          </p>
        </div>

        {/* Deep Dive Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "15px", color: "var(--color-text)", lineHeight: 1.75 }}>
          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              1. Space-Optimized Levenshtein Distance ($O(N)$ Memory)
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              Standard 2D Levenshtein algorithms allocate an $(M + 1) \times (N + 1)$ matrix. When searching 59+ cartridges on every keystroke, continuous heap allocations trigger browser garbage collection stutter. We reduce memory complexity to $O(N)$ by maintaining only two alternating 1D rows:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(255, 92, 138, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-pink)", lineHeight: 1.55 }}>
                <code>{`export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // Insertion
        prev[j] + 1,           // Deletion
        prev[j - 1] + cost     // Substitution
      );
    }
    [prev, curr] = [curr, prev]; // Swap row pointers
  }
  return prev[b.length];
}`}</code>
              </pre>
            </div>
          </section>

          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              2. Multi-Attribute Weighted Relevance Ranking
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              Search scoring must prioritize exact name matches while gracefully accommodating typos in gameplay tags, eras, and mathematical descriptions:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(77, 232, 232, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-cyan)", lineHeight: 1.55 }}>
                <code>{`// Normalized relevance score formula
const SCORE_WEIGHTS = {
  name: 0.40,        // 40% Name match
  platform: 0.20,    // 20% Platform match
  genre: 0.15,       // 15% Genre match
  description: 0.10, // 10% Description keywords
  tags: 0.10,        // 10% Gameplay tags
  year: 0.05,        // 5% Release era / year
};`}</code>
              </pre>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--color-surface-border)" }}>
          <Link
            href="/case-studies"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--arcade-cyan)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO ALL CASE STUDIES</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
