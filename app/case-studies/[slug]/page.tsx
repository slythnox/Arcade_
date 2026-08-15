import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/data/caseStudies";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCaseStudies().map((study) => ({
    slug: study.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  return constructSiteMetadata({
    title: study.title,
    description: study.summary,
    path: `/case-studies/${study.slug}`,
    keywords: study.topics,
  });
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);

  if (!study) {
    notFound();
  }

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail
        items={[
          { label: "CASE STUDIES", href: "/case-studies" },
          { label: `STUDY #${study.number}` },
        ]}
      />

      <article style={{ maxWidth: "820px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--arcade-yellow)",
                backgroundColor: "rgba(255, 216, 77, 0.12)",
                border: "1px solid rgba(255, 216, 77, 0.3)",
                padding: "3px 10px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              ENGINE STUDY #{study.number}
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-dim)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              <Clock size={14} /> {study.readTime}
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
            {study.title}
          </h1>

          <p style={{ fontSize: "16px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            {study.subtitle}
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {study.content.map((sec, idx) => (
            <section
              key={idx}
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-border)",
                borderRadius: "8px",
                padding: "24px 28px",
                boxShadow: "0 4px 16px rgba(4, 6, 12, 0.4)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "19px",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  marginBottom: "12px",
                }}
              >
                {sec.heading}
              </h2>
              <p style={{ fontSize: "15px", color: "var(--color-text-dim)", lineHeight: 1.7, marginBottom: sec.codeSnippet ? "18px" : "0" }}>
                {sec.body}
              </p>

              {sec.codeSnippet && (
                <div
                  style={{
                    backgroundColor: "#070b14",
                    border: "1px solid rgba(77, 232, 232, 0.25)",
                    borderRadius: "6px",
                    padding: "16px 20px",
                    overflowX: "auto",
                  }}
                >
                  <pre
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--arcade-cyan)",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    <code>{sec.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </section>
          ))}
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
