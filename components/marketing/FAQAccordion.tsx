"use client";

import React, { useState } from "react";
import { FAQItem } from "@/data/faq";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface FAQAccordionProps {
  items: FAQItem[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            style={{
              backgroundColor: "var(--color-surface)",
              border: "var(--border-width) solid var(--color-surface-border)",
              boxShadow: "var(--shadow-pixel-sm)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggle(item.id)}
              style={{
                width: "100%",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "left",
                backgroundColor: isOpen ? "var(--color-surface-elevated)" : "transparent",
                color: isOpen ? "var(--color-green-bright)" : "var(--color-text)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
              }}
            >
              <span>{item.question}</span>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "16px 20px",
                  fontSize: "14px",
                  color: "var(--color-text-dim)",
                  lineHeight: 1.6,
                  borderTop: "1px solid var(--color-surface-border)",
                }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
