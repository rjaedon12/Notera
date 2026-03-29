"use client"

import { SubjectPills } from "./subject-pills"
import { SortDropdown, type SortOption } from "./sort-dropdown"

interface FilterBarProps {
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null, slug: string | null) => void
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function FilterBar({ selectedCategoryId, onSelectCategory, sort, onSortChange }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <SubjectPills selectedCategoryId={selectedCategoryId} onSelect={onSelectCategory} />
      <div className="flex items-center justify-between">
        <div />
        <SortDropdown value={sort} onChange={onSortChange} />
      </div>
    </div>
  )
}
