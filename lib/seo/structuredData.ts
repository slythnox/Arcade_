import type { GameDefinition } from "../../games/types";

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ARCADE_",
    url: "https://arcade.games",
    description: "A math-driven, black/green, overgrown retro arcade for browser games.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://arcade.games/games?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateGameSchema(game: GameDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: game.name,
    operatingSystem: "Any (Browser)",
    applicationCategory: "GameApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: game.description,
    genre: game.genre,
    author: {
      "@type": "Organization",
      name: "ARCADE_",
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://arcade.games${item.url}`,
    })),
  };
}
