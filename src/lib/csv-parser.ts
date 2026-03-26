/**
 * RFC 4180-compliant CSV line parser.
 *
 * Handles:
 *  - Quoted fields that contain commas  →  "arbitror, arbitrāri, arbitrātus sum"
 *  - Escaped quotes inside fields       →  "She said ""hello"""
 *  - Unquoted fields                    →  hello,world
 *  - Mixed quoted / unquoted            →  "term, with comma",plain definition
 *
 * Returns an array of field strings for one line.
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  const len = line.length

  while (i < len) {
    // Skip leading whitespace before a field (but not inside quotes)
    while (i < len && (line[i] === " " || line[i] === "\t")) i++

    if (i >= len) {
      fields.push("")
      break
    }

    if (line[i] === '"') {
      // ── Quoted field ──
      i++ // skip opening quote
      let value = ""
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            // escaped quote ""
            value += '"'
            i += 2
          } else {
            // closing quote
            i++ // skip closing quote
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value)
      // skip any whitespace and the comma after the field
      while (i < len && line[i] !== ",") i++
      if (i < len) i++ // skip the comma
    } else {
      // ── Unquoted field ──
      let value = ""
      while (i < len && line[i] !== ",") {
        value += line[i]
        i++
      }
      fields.push(value.trim())
      if (i < len) i++ // skip the comma
    }
  }

  return fields
}

/**
 * Parse CSV text (multi-line) into an array of { term, definition } pairs.
 *
 * - Auto-detects and skips header rows (common header words).
 * - Handles quoted fields with embedded commas.
 * - Supports both 2-column CSVs and those with extra columns
 *   (extra columns are joined back into the definition).
 */
export function parseCSVContent(text: string): { term: string; definition: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []

  // Detect & skip header row
  const first = lines[0].toLowerCase()
  const headerWords = ["english", "chinese", "pinyin", "term", "definition", "latin", "front", "back"]
  const hasHeader = headerWords.some((w) => first.includes(w))
  const dataLines = hasHeader ? lines.slice(1) : lines

  const cards: { term: string; definition: string }[] = []

  for (const line of dataLines) {
    const fields = parseCSVLine(line)
    if (fields.length < 2) continue

    const term = fields[0].trim()
    // If there are more than 2 columns, join the rest as the definition
    const definition = fields.slice(1).join(", ").trim()

    if (term && definition) {
      cards.push({ term, definition })
    }
  }

  return cards
}
