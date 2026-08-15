import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { gameRegistry, getGameBySlug } from "@/games/registry";
import { constructGameMetadata } from "@/lib/seo/metadata";
import { generateGameSchema, generateBreadcrumbSchema } from "@/lib/seo/structuredData";
import { GameShell } from "@/components/game/GameShell";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return gameRegistry.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return constructGameMetadata(game);
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const gameSchema = generateGameSchema(game);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Games", url: "/games" },
    { name: game.name, url: `/games/${game.slug}` },
  ]);

  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - var(--header-height))",
        maxHeight: "calc(100vh - var(--header-height))",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        paddingTop: "6px",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Steam Big Picture Launch Stage */}
      <GameShell gameSlug={game.slug} />
    </div>
  );
}
