"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  children?: Category[]
}

interface SubjectPillsProps {
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null, slug: string | null) => void
}

export function SubjectPills({ selectedCategoryId, onSelect }: SubjectPillsProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    staleTime: 60_000,
  })

  // Find the selected top-level category to show its children
  const selectedParent = selectedCategoryId
    ? categories.find(c => c.id === selectedCategoryId || c.children?.some(ch => ch.id === selectedCategoryId))
    : null

  const subcategories = selectedParent?.children ?? []
  const isSubcategorySelected = subcategories.some(ch => ch.id === selectedCategoryId)

  return (
    <div className="space-y-2">
      {/* Top-level subject pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => {
          const isActive = cat.id === selectedCategoryId || cat.children?.some(ch => ch.id === selectedCategoryId)
          return (
            <PillButton
              key={cat.id}
              active={!!isActive}
              onClick={() => isActive ? onSelect(null, null) : onSelect(cat.id, cat.slug)}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </PillButton>
          )
        })}
      </div>

      {/* Subcategory pills (shown when a top-level is selected) */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <PillButton
            active={!isSubcategorySelected}
            onClick={() => onSelect(selectedParent!.id, selectedParent!.slug)}
            size="sm"
          >
            All {selectedParent!.name}
          </PillButton>
          {subcategories.map(sub => (
            <PillButton
              key={sub.id}
              active={sub.id === selectedCategoryId}
              onClick={() => onSelect(sub.id, sub.slug)}
              size="sm"
            >
              {sub.icon && <span className="mr-1">{sub.icon}</span>}
              {sub.name}
            </PillButton>
          ))}
        </div>
      )}
    </div>
  )
}

function PillButton({ active, onClick, children, size = "md" }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  size?: "sm" | "md"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full font-medium transition-all flex-shrink-0",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border bg-transparent hover:bg-[var(--glass-fill-hover)]"
      )}
      style={active ? undefined : {
        borderColor: "var(--glass-border)",
        color: "var(--foreground)",
      }}
    >
      {children}
    </button>
  )
}
