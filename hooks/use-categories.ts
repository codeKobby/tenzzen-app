'use client';

import { useState } from 'react';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  courseCount: number;
}

export function useCategories() {
  // Default categories - can be expanded when category system is implemented in Convex
  const fallbackCategories: Category[] = [
    { id: "all", name: "All", slug: "all", courseCount: 0 }
  ];

  const [categories] = useState<Category[]>(fallbackCategories);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  return {
    categories,
    loading,
    error
  };
}
