"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight, X, FolderOpen } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  children?: Category[]
}

interface CategoryPickerProps {
  value: string | null
  onChange: (categoryId: string | null) => void
  placeholder?: string
}

export function CategoryPicker({ value, onChange, placeholder = "Select a category..." }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const { data: tree = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
    staleTime: 60_000,
  })

  // Find selected category name from tree
  const selectedLabel = findCategoryById(tree, value)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Current list to display: root or children of last breadcrumb item
  const currentItems = breadcrumb.length === 0
    ? tree
    : breadcrumb[breadcrumb.length - 1].children ?? []

  function handleSelect(cat: Category) {
    if (cat.children && cat.children.length > 0) {
      // Drill into subcategories
      setBreadcrumb([...breadcrumb, cat])
    } else {
      // Leaf node — select it
      onChange(cat.id)
      setOpen(false)
      setBreadcrumb([])
    }
  }

  function handleBreadcrumbClick(index: number) {
    if (index < 0) {
      setBreadcrumb([])
    } else {
      setBreadcrumb(breadcrumb.slice(0, index + 1))
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setBreadcrumb([])
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) setBreadcrumb([])
        }}
        className="w-full flex items-center justify-between h-10 px-3 rounded-lg border text-sm transition-colors
          hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0"
        style={{
          borderColor: "var(--glass-border)",
          background: "var(--glass-fill)",
          color: selectedLabel ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        <span className="truncate flex items-center gap-2">
          {selectedLabel ? (
            <>
              <FolderOpen className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
              {selectedLabel}
            </>
          ) : (
            placeholder
          )}
        </span>
        {value ? (
          <X className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" onClick={handleClear} />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border shadow-lg"
          style={{
            background: "var(--popover-bg, var(--card))",
            borderColor: "var(--glass-border)",
          }}
        >
          {/* Breadcrumb nav */}
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-2 text-xs border-b"
              style={{ borderColor: "var(--glass-border)", color: "var(--muted-foreground)" }}>
              <button
                type="button"
                className="hover:underline"
                onClick={() => handleBreadcrumbClick(-1)}
              >
                All
              </button>
              {breadcrumb.map((bc, i) => (
                <span key={bc.id} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => handleBreadcrumbClick(i)}
                  >
                    {bc.icon ? `${bc.icon} ${bc.name}` : bc.name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Items */}
          {currentItems.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
              No categories available
            </div>
          ) : (
            currentItems.map((cat) => {
              const hasChildren = cat.children && cat.children.length > 0
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
                    hover:bg-[var(--accent)]"
                  style={{ color: "var(--foreground)" }}
                  onClick={() => handleSelect(cat)}
                >
                  <span className="flex items-center gap-2">
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </span>
                  {hasChildren && (
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  )}
                </button>
              )
            })
          )}

          {/* Allow selecting a parent category directly */}
          {breadcrumb.length > 0 && (
            <div className="border-t" style={{ borderColor: "var(--glass-border)" }}>
              <button
                type="button"
                className="w-full px-3 py-2 text-sm transition-colors hover:bg-[var(--accent)] text-left"
                style={{ color: "var(--primary)" }}
                onClick={() => {
                  const parent = breadcrumb[breadcrumb.length - 1]
                  onChange(parent.id)
                  setOpen(false)
                  setBreadcrumb([])
                }}
              >
                Select &ldquo;{breadcrumb[breadcrumb.length - 1].name}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Walk the tree to find a category by id and return its display name chain */
function findCategoryById(tree: Category[], id: string | null): string | null {
  if (!id) return null
  for (const cat of tree) {
    if (cat.id === id) return cat.icon ? `${cat.icon} ${cat.name}` : cat.name
    if (cat.children) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}
