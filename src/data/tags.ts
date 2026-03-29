/**
 * Predefined tag definitions for study sets.
 *
 * Keep this list broad — each tag should cover a meaningful topic area.
 * Tags are normalized to lowercase slugs everywhere in the app.
 */

export interface TagDefinition {
  /** Slug / canonical lowercase name stored in the database */
  slug: string
  /** Human-readable display label */
  label: string
  /** Short description shown in the selector */
  description: string
  /** Color token used by TagChip (matches tag-chip.tsx palette) */
  color: "blue" | "green" | "purple" | "orange" | "pink" | "yellow" | "red"
}

export const PREDEFINED_TAGS: TagDefinition[] = [
  { slug: "language",   label: "Language",   description: "Foreign language study",    color: "blue"   },
  { slug: "history",    label: "History",    description: "Historical events & eras",  color: "red"    },
  { slug: "vocabulary", label: "Vocabulary", description: "Word lists & definitions",  color: "green"  },
  { slug: "chinese",    label: "Chinese",    description: "Mandarin / Chinese",        color: "orange" },
  { slug: "latin",      label: "Latin",      description: "Latin language",             color: "purple" },
  { slug: "spanish",    label: "Spanish",    description: "Spanish language",           color: "yellow" },
  { slug: "german",     label: "German",     description: "German language",            color: "pink"   },
  { slug: "science",    label: "Science",    description: "Science & nature",           color: "green"  },
  { slug: "ap",         label: "AP",         description: "Advanced Placement level",   color: "red"    },
  { slug: "beginner",   label: "Beginner",   description: "Introductory / basics",      color: "blue"   },
]

/** Fast lookup map */
export const TAG_MAP = new Map(PREDEFINED_TAGS.map((t) => [t.slug, t]))

/** Return the TagDefinition for a slug, or a default gray one */
export function getTagDef(slug: string): TagDefinition {
  return (
    TAG_MAP.get(slug.toLowerCase()) ?? {
      slug: slug.toLowerCase(),
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      description: "",
      color: "blue",
    }
  )
}
