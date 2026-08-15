import type { MetadataRoute } from "next";
import { gameRegistry, labsRegistry } from "@/games/registry";
import { getAllCaseStudies } from "@/data/caseStudies";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://arcade.games";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/games`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/labs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/case-studies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic game routes from single source of truth registry
  const gameRoutes: MetadataRoute.Sitemap = gameRegistry
    .filter((game) => game.category === "arcade")
    .map((game) => ({
      url: `${baseUrl}/games/${game.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  // Dynamic Labs experiment routes
  const labsRoutes: MetadataRoute.Sitemap = labsRegistry.map((game) => ({
    url: `${baseUrl}/labs/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Dynamic case study routes
  const caseStudyRoutes: MetadataRoute.Sitemap = getAllCaseStudies().map((study) => ({
    url: `${baseUrl}/case-studies/${study.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...gameRoutes, ...labsRoutes, ...caseStudyRoutes];
}

