import type { MetadataRoute } from "next";

const BASE_URL = "https://www.notera.us";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static public pages ──────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    // Core / marketing
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // Discover / browse
    {
      url: `${BASE_URL}/discover`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/library`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },

    // Study tools (public landing pages)
    {
      url: `${BASE_URL}/sets`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/quizzes`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/dbq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/daily-review`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/studyguides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/notes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },

    // Community
    {
      url: `${BASE_URL}/forum`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/groups`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },

    // Tools
    {
      url: `${BASE_URL}/whiteboard`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/timeline-builder`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/sightreading`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },

    // Math tools
    {
      url: `${BASE_URL}/math`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/math/solver`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/math/graphing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/math/matrix`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/sieve`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/gcd`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/euler-totient`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/riemann`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/base-converter`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/modular-clock`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/math/computer-algebra`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },

    // Achievements
    {
      url: `${BASE_URL}/achievements`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },

    // Analytics
    {
      url: `${BASE_URL}/analytics`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // ── Dynamic routes ───────────────────────────────────────────────
  // NOTE: To include individual set/quiz/dbq/etc. pages in the sitemap
  // you should fetch IDs from your database. For now the static index
  // pages are included. Uncomment and adapt the example below once
  // you're ready:
  //
  // const sets = await prisma.flashcardSet.findMany({ select: { id: true, updatedAt: true } });
  // const setRoutes = sets.map((s) => ({
  //   url: `${BASE_URL}/sets/${s.id}`,
  //   lastModified: s.updatedAt,
  //   changeFrequency: "weekly" as const,
  //   priority: 0.6,
  // }));

  return [...staticRoutes];
}
