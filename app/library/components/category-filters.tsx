"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Star,
  BookOpen,
  File,
  Code,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryFilter } from "@/types/notes"

const categories = [
  { id: "all", name: "All Notes", icon: <FileText className="h-4 w-4" /> },
  { id: "starred", name: "Starred", icon: <Star className="h-4 w-4" /> },
  { id: "course", name: "Course Notes", icon: <BookOpen className="h-4 w-4" /> },
  { id: "personal", name: "Personal Notes", icon: <File className="h-4 w-4" /> },
  { id: "code", name: "Code Snippets", icon: <Code className="h-4 w-4" /> },
]

interface CategoryFiltersProps {
  filter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  counts: Record<CategoryFilter, number>;
}

export function CategoryFilters({ filter, onFilterChange, counts }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={filter === category.id ? "secondary" : "outline"}
          className={cn(
            "h-8 gap-2 transition-colors duration-200",
            filter === category.id && "bg-primary/10"
          )}
          onClick={() => onFilterChange(category.id as CategoryFilter)}
        >
          {category.icon}
          <span>{category.name}</span>
          <Badge
            variant="secondary"
            className="ml-1"
          >
            {counts[category.id as CategoryFilter] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  )
}
