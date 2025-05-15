'use client';

import { useCategories, Category } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface CategoryPillsProps {
  className?: string;
  showAll?: boolean;
  limit?: number;
  customCategories?: Array<{ name: string, slug: string, courseCount: number }>;
  onCategoryChange?: (category: string) => void;
}

export function CategoryPills({
  className,
  showAll = true,
  limit,
  customCategories,
  onCategoryChange
}: CategoryPillsProps) {
  const { categories: fetchedCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeButtonRef, setActiveButtonRef] = useState<HTMLButtonElement | null>(null);

  const currentCategory = searchParams.get('category') || 'all';

  // Use custom categories if provided, otherwise use fetched categories
  const categories = customCategories || fetchedCategories;

  // Filter out categories with no courses (except "All" category)
  const filteredCategories = categories.filter(cat =>
    cat.slug === 'all' || cat.courseCount > 0
  );

  // Limit the number of categories if specified
  const displayCategories = limit ? filteredCategories.slice(0, limit) : filteredCategories;

  // Scroll active category into view when it changes
  useEffect(() => {
    if (activeButtonRef && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeButtonRef;

      // Calculate position to center the button
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      // Smooth scroll to position
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentCategory, activeButtonRef]);

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams);

    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }

    // Reset to page 1 when changing category
    params.delete('page');

    // Call the onCategoryChange callback if provided
    if (onCategoryChange) {
      onCategoryChange(slug);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const loading = categoriesLoading && !customCategories;

  if (loading) {
    return (
      <div className={cn("flex gap-2 py-2", className)}>
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className={cn("w-full", className)}>
      <div ref={scrollRef} className="flex gap-2 py-2">
        {showAll && (
          <Button
            ref={currentCategory === 'all' ? (btn) => setActiveButtonRef(btn) : undefined}
            variant={currentCategory === 'all' ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full transition-all duration-300",
              currentCategory === 'all' && "shadow-md"
            )}
            onClick={() => handleCategoryClick('all')}
          >
            All Categories
          </Button>
        )}

        {displayCategories.map((category) => (
          <Button
            key={category.id || category.slug}
            ref={currentCategory === category.slug ? (btn) => setActiveButtonRef(btn) : undefined}
            variant={currentCategory === category.slug ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full whitespace-nowrap transition-all duration-300",
              currentCategory === category.slug && "shadow-md"
            )}
            onClick={() => handleCategoryClick(category.slug)}
          >
            {category.name}
            {category.courseCount > 0 && (
              <span className="ml-1 text-xs opacity-70">({category.courseCount})</span>
            )}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
