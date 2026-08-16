import type { Metadata } from "next";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProceduralBackground } from "@/components/environment/ProceduralBackground";
import { FixedBottomFlora } from "@/components/environment/FixedBottomFlora";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { generateWebSiteSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = constructSiteMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateWebSiteSchema();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ProceduralBackground />
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <SiteHeader />
          <main style={{ flex: "1 0 auto" }}>{children}</main>
          <SiteFooter />
        </div>
        {/* Fixed persistent retro pixel flowerbed along bottom */}
        <FixedBottomFlora />
        <Analytics />
      </body>
    </html>
  );
}
