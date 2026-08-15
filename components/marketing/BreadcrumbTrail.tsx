import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({ items }) => {
  return (
    <nav
      aria-label="Breadcrumbs"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
        fontSize: "12px",
        fontFamily: "var(--font-mono)",
        color: "var(--color-muted)",
        marginBottom: "20px",
      }}
    >
      <Link href="/" style={{ color: "var(--color-text-muted)" }}>
        ARCADE_
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} color="var(--color-muted)" />
          {item.href ? (
            <Link href={item.href} style={{ color: "var(--color-text-dim)" }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--color-green-bright)", fontWeight: 700 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
