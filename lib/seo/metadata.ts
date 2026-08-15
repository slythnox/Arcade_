import { Metadata } from "next";
import { GameDefinition } from "../../games/types";

const SITE_NAME = "ARCADE_";
const SITE_URL = "https://arcade.games";
const DEFAULT_DESCRIPTION =
  "A math-driven, black/green, overgrown retro arcade for browser games — built from scratch with a custom 2D game engine, deterministic simulations, and procedural environments.";

export function constructSiteMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  keywords = [],
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
} = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — 1990s Overgrown Retro Arcade`;
  const canonicalUrl = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      "retro arcade",
      "browser games",
      "custom game engine",
      "tetris online",
      "snake online",
      "breakout online",
      "minesweeper online",
      "pong online",
      "deterministic game loop",
      ...keywords,
    ],
    authors: [{ name: "ARCADE_" }],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function constructGameMetadata(game: GameDefinition): Metadata {
  return constructSiteMetadata({
    title: game.seo.title,
    description: game.seo.description,
    path: `/games/${game.slug}`,
    keywords: game.seo.keywords || game.tags,
  });
}
