// Timeline feature removed — models (Resource, TimelineEvent, TimelineArrow) no longer in schema.
// Stub exports preserved to avoid import errors in any remaining references.

export interface TimelineEventInput {
  id: string
  dateLabel?: string
  date?: string
  title?: string
  body?: string
  description?: string
  sortOrder?: number
  posX?: number
  posY?: number
  x?: number
  y?: number
}

export interface TimelineArrowInput {
  fromEventId?: string
  toEventId?: string
  source?: string
  target?: string
  from?: string
  to?: string
  label?: string | null
}

export interface SaveTimelinePayload {
  resourceId: string
  events: TimelineEventInput[]
  edges?: TimelineArrowInput[]
}

export interface SaveTimelineResult {
  ok: boolean
  error?: string
  details?: string
  savedEvents?: number
  savedArrows?: number
}

export async function saveTimeline(_payload: SaveTimelinePayload): Promise<SaveTimelineResult> {
  return { ok: false, error: "Timeline feature is no longer available" }
}

export async function loadTimeline(_resourceId: string): Promise<{ events: TimelineEventInput[]; arrows: TimelineArrowInput[] }> {
  return { events: [], arrows: [] }
}
