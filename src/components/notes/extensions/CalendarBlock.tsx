"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { useState, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    calendarBlock: {
      setCalendarBlock: () => ReturnType
    }
  }
}

interface CalendarEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
  color: string
}

const EVENT_COLORS = [
  "#2383e2",
  "#6940a5",
  "#d44c47",
  "#cb912f",
  "#448361",
  "#337ea9",
]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CalendarComponent({ node, updateAttributes }: any) {
  const events: CalendarEvent[] = node.attrs.events || []
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays = useMemo(() => {
    const days: {
      day: number
      month: number
      year: number
      isCurrentMonth: boolean
      dateStr: string
    }[] = []

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const m = viewMonth - 1 < 0 ? 11 : viewMonth - 1
      const y = viewMonth - 1 < 0 ? viewYear - 1 : viewYear
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      })
    }

    // Next month leading days (fill to 42 cells = 6 rows)
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth + 1 > 11 ? 0 : viewMonth + 1
      const y = viewMonth + 1 > 11 ? viewYear + 1 : viewYear
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      })
    }

    return days
  }, [viewYear, viewMonth, daysInMonth, firstDayOfMonth, prevMonthDays])

  const getEventsForDate = useCallback(
    (dateStr: string) => events.filter((e) => e.date === dateStr),
    [events]
  )

  const addEvent = useCallback(
    (dateStr: string) => {
      if (!newTitle.trim()) return
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID(),
        date: dateStr,
        title: newTitle.trim(),
        color: EVENT_COLORS[events.length % EVENT_COLORS.length],
      }
      updateAttributes({ events: [...events, newEvent] })
      setNewTitle("")
    },
    [events, newTitle, updateAttributes]
  )

  const deleteEvent = useCallback(
    (id: string) => {
      updateAttributes({ events: events.filter((e) => e.id !== id) })
      if (editingEvent === id) setEditingEvent(null)
    },
    [events, updateAttributes, editingEvent]
  )

  const updateEventTitle = useCallback(
    (id: string, title: string) => {
      updateAttributes({
        events: events.map((e) => (e.id === id ? { ...e, title } : e)),
      })
    },
    [events, updateAttributes]
  )

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  return (
    <NodeViewWrapper>
      <div className="calendar-block" contentEditable={false}>
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-nav">
            <button onClick={prevMonth} className="calendar-nav-btn">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="calendar-month-label">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="calendar-nav-btn">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button onClick={goToToday} className="calendar-today-btn">
            Today
          </button>
        </div>

        {/* Day of week headers */}
        <div className="calendar-grid calendar-day-headers">
          {DAYS.map((d) => (
            <div key={d} className="calendar-day-header">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          {calendarDays.map((day, i) => {
            const dayEvents = getEventsForDate(day.dateStr)
            const isToday = day.dateStr === todayStr
            const isSelected = day.dateStr === selectedDate

            return (
              <div
                key={i}
                className={`calendar-cell ${!day.isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                onClick={() =>
                  setSelectedDate(isSelected ? null : day.dateStr)
                }
              >
                <span
                  className={`calendar-day-number ${isToday ? "today-number" : ""}`}
                >
                  {day.day}
                </span>
                <div className="calendar-cell-events">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="calendar-event-pill"
                      style={{
                        backgroundColor: ev.color + "18",
                        color: ev.color,
                        borderLeft: `2px solid ${ev.color}`,
                      }}
                    >
                      <span className="calendar-event-pill-text">
                        {ev.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="calendar-more-events">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected date detail panel */}
        {selectedDate && (
          <div className="calendar-detail-panel">
            <div className="calendar-detail-header">
              <span className="calendar-detail-date">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="calendar-detail-close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Events for selected date */}
            <div className="calendar-detail-events">
              {getEventsForDate(selectedDate).length === 0 && (
                <div className="calendar-detail-empty">
                  No events on this day
                </div>
              )}
              {getEventsForDate(selectedDate).map((ev) => (
                <div key={ev.id} className="calendar-detail-event">
                  {editingEvent === ev.id ? (
                    <div className="calendar-detail-event-edit">
                      <input
                        value={ev.title}
                        onChange={(e) =>
                          updateEventTitle(ev.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditingEvent(null)
                        }}
                        className="calendar-detail-event-input"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingEvent(null)}
                        className="calendar-detail-save"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div
                      className="calendar-detail-event-view"
                      onClick={() => setEditingEvent(ev.id)}
                    >
                      <div
                        className="calendar-detail-event-dot"
                        style={{ backgroundColor: ev.color }}
                      />
                      <span className="calendar-detail-event-title">
                        {ev.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteEvent(ev.id)
                        }}
                        className="calendar-detail-delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new event */}
            <div className="calendar-detail-add">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim() && selectedDate) {
                    addEvent(selectedDate)
                  }
                }}
                placeholder="Add event…"
                className="calendar-detail-add-input"
              />
              <button
                onClick={() =>
                  newTitle.trim() && selectedDate && addEvent(selectedDate)
                }
                disabled={!newTitle.trim()}
                className="calendar-detail-add-btn"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const CalendarBlock = Node.create({
  name: "calendarBlock",
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
    return [{ tag: 'div[data-type="calendar-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "calendar-block" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalendarComponent)
  },

  addCommands() {
    return {
      setCalendarBlock:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "calendarBlock",
              attrs: { events: [] },
            })
            .run()
        },
    }
  },
})
