/**
 * Quizlet Scraper — TypeScript implementation
 *
 * Inspired by https://github.com/ashton0223/quizlet-scraper
 *
 * Fetches a Quizlet set page, extracts embedded JSON data,
 * and returns the set title, description, and term/definition pairs.
 */

export interface QuizletTerm {
  term: string
  definition: string
}

export interface QuizletSet {
  title: string
  description: string
  numTerms: number
  terms: QuizletTerm[]
}

/**
 * Extract the Quizlet set ID from various URL formats:
 * - https://quizlet.com/123456789/example-set-flash-cards/
 * - https://quizlet.com/123456789
 * - https://quizlet.com/gb/123456789/example-set/
 */
function extractSetId(url: string): string | null {
  // Match numeric ID from Quizlet URL
  const match = url.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/)
  return match ? match[1] : null
}

/**
 * Validate that a URL is a Quizlet set URL
 */
export function isValidQuizletUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.endsWith("quizlet.com") && extractSetId(url) !== null
  } catch {
    return false
  }
}

/**
 * Try to extract set data from the __NEXT_DATA__ JSON embedded in the HTML.
 * Quizlet uses Next.js and embeds hydration data in a script tag.
 */
function extractFromNextData(html: string): QuizletSet | null {
  const nextDataMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) return null

  try {
    const data = JSON.parse(nextDataMatch[1])

    // Navigate the Next.js data structure — Quizlet embeds set info in dehydratedState
    const dehydrated = data?.props?.pageProps?.dehydratedState
    if (dehydrated?.queries) {
      for (const query of dehydrated.queries) {
        const state = query?.state?.data
        if (state?.studiableItem || state?.set) {
          const set = state.set || state
          const studiableData = state?.studiableItem?.studiableItems || []

          if (set?.title) {
            const terms: QuizletTerm[] = studiableData
              .filter((item: Record<string, unknown>) => item?.cardSides)
              .map((item: Record<string, unknown>) => {
                const sides = item.cardSides as Array<{ sideId: number; label: string; media: Array<{ plainText?: string; richText?: string }> }>
                const wordSide = sides?.find((s) => s.label === "word") || sides?.[0]
                const defSide = sides?.find((s) => s.label === "definition") || sides?.[1]
                return {
                  term: wordSide?.media?.[0]?.plainText || wordSide?.media?.[0]?.richText || "",
                  definition: defSide?.media?.[0]?.plainText || defSide?.media?.[0]?.richText || "",
                }
              })
              .filter((t: QuizletTerm) => t.term || t.definition)

            if (terms.length > 0) {
              return {
                title: set.title,
                description: set.description || "",
                numTerms: terms.length,
                terms,
              }
            }
          }
        }
      }
    }

    // Alternative path: pageProps may have the set directly
    const pageProps = data?.props?.pageProps
    if (pageProps?.set) {
      const set = pageProps.set
      const terms: QuizletTerm[] = (set.terms || []).map(
        (t: { word: string; definition: string; _wordRichText?: string; _definitionRichText?: string }) => ({
          term: t.word || t._wordRichText || "",
          definition: t.definition || t._definitionRichText || "",
        })
      )
      if (terms.length > 0) {
        return {
          title: set.title || "",
          description: set.description || "",
          numTerms: terms.length,
          terms,
        }
      }
    }
  } catch {
    // JSON parse failure or unexpected structure
  }

  return null
}

/**
 * Try to extract set data from structured data (JSON-LD) in the HTML.
 */
function extractFromJsonLd(html: string): QuizletSet | null {
  const jsonLdMatches = html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1])
      if (data?.["@type"] === "ItemList" && data?.itemListElement) {
        // JSON-LD flashcard list
        const terms: QuizletTerm[] = data.itemListElement.map(
          (item: { name?: string; acceptedAnswer?: { text?: string } }) => ({
            term: item.name || "",
            definition: item.acceptedAnswer?.text || "",
          })
        )
        if (terms.length > 0) {
          // Try to get title from page
          const titleMatch = html.match(/<title>([^<]*)<\/title>/)
          const title = titleMatch ? titleMatch[1].replace(/ (\| Quizlet|- Quizlet|Flashcards).*$/i, "").trim() : "Imported Set"
          return { title, description: "", numTerms: terms.length, terms }
        }
      }
    } catch {
      continue
    }
  }
  return null
}

/**
 * Fallback: Extract terms from Quizlet's HTML card elements using regex.
 * Quizlet renders card data in the page HTML with data attributes or specific class patterns.
 */
function extractFromHtmlElements(html: string): QuizletSet | null {
  // Try to find terms in the "SetPage-terms" section
  const terms: QuizletTerm[] = []

  // Pattern 1: data-testid based extraction
  const termBlocks = html.matchAll(
    /data-testid="(?:term|word)"[^>]*>([^<]*)<[\s\S]*?data-testid="(?:definition|def)"[^>]*>([^<]*)</g
  )
  for (const m of termBlocks) {
    if (m[1]?.trim() || m[2]?.trim()) {
      terms.push({ term: m[1].trim(), definition: m[2].trim() })
    }
  }

  // Pattern 2: aria-label based extraction
  if (terms.length === 0) {
    const ariaBlocks = html.matchAll(
      /aria-label="Term"[^>]*>([^<]*)[\s\S]*?aria-label="Definition"[^>]*>([^<]*)/g
    )
    for (const m of ariaBlocks) {
      if (m[1]?.trim() || m[2]?.trim()) {
        terms.push({ term: m[1].trim(), definition: m[2].trim() })
      }
    }
  }

  if (terms.length > 0) {
    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/ (\| Quizlet|- Quizlet|Flashcards).*$/i, "").trim() : "Imported Set"
    return { title, description: "", numTerms: terms.length, terms }
  }

  return null
}

/**
 * Fallback: Use Quizlet's internal web API to fetch set data.
 * This tries the studiable-item-documents endpoint.
 */
async function fetchFromWebApi(setId: string): Promise<QuizletSet | null> {
  try {
    const apiUrl = `https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=${setId}&filters%5BstudiableContainerType%5D=1&perPage=500&page=1`
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: `https://quizlet.com/${setId}/`,
      },
    })

    if (!res.ok) return null

    const data = await res.json()
    const items = data?.responses?.[0]?.models?.studiableItem || []
    const terms: QuizletTerm[] = items
      .map((item: Record<string, unknown>) => {
        const sides = item.cardSides as Array<{
          label: string
          media: Array<{ plainText?: string; richText?: string }>
        }> | undefined
        if (!sides || sides.length < 2) return null
        const wordSide = sides.find((s) => s.label === "word") || sides[0]
        const defSide = sides.find((s) => s.label === "definition") || sides[1]
        return {
          term: wordSide?.media?.[0]?.plainText || "",
          definition: defSide?.media?.[0]?.plainText || "",
        }
      })
      .filter((t: QuizletTerm | null): t is QuizletTerm => t !== null && (!!t.term || !!t.definition))

    if (terms.length > 0) {
      // Fetch set title separately
      const setRes = await fetch(`https://quizlet.com/webapi/3.4/sets/${setId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: `https://quizlet.com/${setId}/`,
        },
      })
      let title = "Imported Set"
      let description = ""
      if (setRes.ok) {
        const setData = await setRes.json()
        const setInfo = setData?.responses?.[0]?.models?.set?.[0] || setData?.set
        title = setInfo?.title || title
        description = setInfo?.description || ""
      }
      return { title, description, numTerms: terms.length, terms }
    }
  } catch {
    // API not accessible
  }
  return null
}

/**
 * Main entry point: Scrape a Quizlet set URL and return its data.
 *
 * Tries multiple extraction strategies in order:
 * 1. __NEXT_DATA__ embedded JSON
 * 2. JSON-LD structured data
 * 3. HTML element parsing
 * 4. Quizlet Web API
 */
export async function scrapeQuizletSet(url: string): Promise<QuizletSet> {
  if (!isValidQuizletUrl(url)) {
    throw new Error("Invalid Quizlet URL. Expected format: https://quizlet.com/<set-id>/...")
  }

  const setId = extractSetId(url)
  if (!setId) {
    throw new Error("Could not extract set ID from URL")
  }

  // Ensure URL points to the flashcard page
  const normalizedUrl = `https://quizlet.com/${setId}/`

  // Fetch the page HTML
  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Quizlet page: HTTP ${response.status}`)
  }

  const html = await response.text()

  // Strategy 1: __NEXT_DATA__
  let result = extractFromNextData(html)
  if (result && result.terms.length > 0) return result

  // Strategy 2: JSON-LD
  result = extractFromJsonLd(html)
  if (result && result.terms.length > 0) return result

  // Strategy 3: HTML parsing
  result = extractFromHtmlElements(html)
  if (result && result.terms.length > 0) return result

  // Strategy 4: Web API
  result = await fetchFromWebApi(setId)
  if (result && result.terms.length > 0) return result

  throw new Error(
    "Could not extract flashcard data from the Quizlet page. The set may be private, deleted, or Quizlet's page structure may have changed."
  )
}
