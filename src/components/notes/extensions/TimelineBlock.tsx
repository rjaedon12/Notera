"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { useState, useCallback, useMemo } from "react"
import { Plus, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    timelineBlock: {
      setTimelineBlock: () => ReturnType
    }
  }
}

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  color: string
}

const COLORS = [
  "#2383e2",
  "#6940a5",
  "#d44c47",
  "#cb912f",
  "#448361",
  "#337ea9",
  "#9065b0",
  "#c4554d",
]

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TimelineComponent({ node, updateAttributes }: any) {
  const events: TimelineEvent[] = node.attrs.events || []
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewOffset, setViewOffset] = useState(0)

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  )

  const addEvent = useCallback(() => {
    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      title: "New Event",
      description: "",
      color: COLORS[events.length % COLORS.length],
    }
    updateAttributes({ events: [...events, newEvent] })
    setEditingId(newEvent.id)
  }, [events, updateAttributes])

  const updateEvent = useCallback(
    (id: string, updates: Partial<TimelineEvent>) => {
      updateAttributes({
        events: events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })
    },
    [events, updateAttributes]
  )

  const deleteEvent = useCallback(
    (id: string) => {
      updateAttributes({ events: events.filter((e) => e.id !== id) })
      if (editingId === id) setEditingId(null)
    },
    [events, updateAttributes, editingId]
  )

  // Determine visible range for the visual bar
  const dateRange = useMemo(() => {
    if (sortedEvents.length === 0) return { min: new Date(), max: new Date() }
    const dates = sortedEvents.map((e) => new Date(e.date).getTime())
    const min = new Date(Math.min(...dates))
    const max = new Date(Math.max(...dates))
    const padding = Math.max(
      (max.getTime() - min.getTime()) * 0.15,
      86400000 * 14
    )
    return {
      min: new Date(min.getTime() - padding),
      max: new Date(max.getTime() + padding),
    }
  }, [sortedEvents])

  const getPosition = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr).getTime()
      const range = dateRange.max.getTime() - dateRange.min.getTime()
      if (range === 0) return 50
      return ((date - dateRange.min.getTime()) / range) * 100
    },
    [dateRange]
  )

  return (
    <NodeViewWrapper>
      <div className="timeline-block" contentEditable={false}>
        {/* Header */}
        <div className="timeline-header">
          <div className="timeline-header-left">
            <span className="timeline-icon">📅</span>
            <span className="timeline-title">Timeline</span>
            <span className="timeline-count">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button onClick={addEvent} className="timeline-add-btn">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </button>
        </div>

        {sortedEvents.length > 0 ? (
          <>
            {/* Visual timeline bar */}
            <div className="timeline-visual">
              <div className="timeline-line" />
              {sortedEvents.map((event, i) => (
                <div
                  key={event.id}
                  className="timeline-marker-group"
                  style={{ left: `${Math.max(4, Math.min(96, getPosition(event.date)))}%` }}
                >
                  <button
                    className={`timeline-marker ${editingId === event.id ? "active" : ""}`}
                    style={{ backgroundColor: event.color }}
                    onClick={() =>
                      setEditingId(editingId === event.id ? null : event.id)
                    }
                  />
                  <div className="timeline-marker-date">
                    {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))}
            </div>

            {/* Event list */}
            <div className="timeline-events">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`timeline-event ${editingId === event.id ? "editing" : ""}`}
                >
                  <div
                    className="timeline-event-bar"
                    style={{ backgroundColor: event.color }}
                  />

                  {editingId === event.id ? (
                    <div className="timeline-event-edit">
                      <div className="timeline-event-edit-row">
                        <input
                          type="date"
                          value={event.date}
                          onChange={(e) =>
                            updateEvent(event.id, { date: e.target.value })
                          }
                          className="timeline-input timeline-date-input"
                        />
                        <input
                          value={event.title}
                          onChange={(e) =>
                            updateEvent(event.id, { title: e.target.value })
                          }
                          placeholder="Event title"
                          className="timeline-input timeline-title-input"
                          autoFocus
                        />
                      </div>
                      <textarea
                        value={event.description}
                        onChange={(e) =>
                          updateEvent(event.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description (optional)"
                        className="timeline-input timeline-desc-input"
                        rows={2}
                      />
                      <div className="timeline-event-edit-footer">
                        <div className="timeline-color-picker">
                          {COLORS.map((c) => (
                            <button
                              key={c}
                              className={`timeline-color-dot ${event.color === c ? "active" : ""}`}
                              style={{ backgroundColor: c }}
                              onClick={() =>
                                updateEvent(event.id, { color: c })
                              }
                            />
                          ))}
                        </div>
                        <div className="timeline-event-edit-btns">
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="timeline-btn-delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="timeline-btn-done"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="timeline-event-display"
                      onClick={() => setEditingId(event.id)}
                    >
                      <span className="timeline-event-date">
                        {formatDate(event.date)}
                      </span>
                      <span className="timeline-event-title">
                        {event.title}
                      </span>
                      {event.description && (
                        <span className="timeline-event-desc">
                          {event.description}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="timeline-empty">
            <span className="timeline-empty-icon">📅</span>
            <span>Click &quot;Add Event&quot; to create your first timeline event</span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const TimelineBlock = Node.create({
  name: "timelineBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      events: {
        default: [],
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute("data-events") || "[]")
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => ({
          "data-events": JSON.stringify(attributes.events),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "timeline-block" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineComponent)
  },

  addCommands() {
    return {
      setTimelineBlock:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "timelineBlock",
              attrs: { events: [] },
            })
            .run()
        },
    }
  },
})
