'use client';

import { useCategories, Category } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define a type for custom categories that don't have an ID
type CustomCategory = {
  name: string;
  slug: string;
  courseCount: number;
};

// The component can accept either Category from hooks/use-categories or CustomCategory
interface CategoryPillsProps {
  className?: string;
  showAll?: boolean;
  showRecommended?: boolean;
  limit?: number;
  customCategories?: CustomCategory[];
  onCategoryChange?: (category: string) => void;
}

export function CategoryPills({
  className,
  showAll = true,
  showRecommended = false,
  limit,
  customCategories,
  onCategoryChange
}: CategoryPillsProps) {
  const { categories: fetchedCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeButtonRef, setActiveButtonRef] = useState<HTMLButtonElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const currentCategory = searchParams.get('category') || 'all';

  // Deduplicate custom categories by slug
  const deduplicatedCategories = useMemo(() => {
    if (!customCategories || customCategories.length === 0) return [];

    const uniqueCategories: CustomCategory[] = [];
    const slugMap = new Map<string, CustomCategory>();

    // First pass: collect categories by slug
    customCategories.forEach(category => {
      const normalizedSlug = category.slug.toLowerCase().trim();

      if (slugMap.has(normalizedSlug)) {
        // If we already have this slug, add to the course count
        const existingCategory = slugMap.get(normalizedSlug)!;
        existingCategory.courseCount += category.courseCount;
      } else {
        // Otherwise, add it to our map
        slugMap.set(normalizedSlug, {...category});
      }
    });

    // Convert map to array and sort by course count
    return Array.from(slugMap.values())
      .filter(cat => cat.courseCount > 0) // Only show categories with courses
      .sort((a, b) => b.courseCount - a.courseCount);
  }, [customCategories]);

  // Only show "All" and "Recommended" as fixed pills
  const fixedCategories = [];
  if (showAll) {
    fixedCategories.push({
      name: "All Categories",
      slug: "all",
      courseCount: 0
    });
  }

  if (showRecommended) {
    fixedCategories.push({
      name: "Recommended for You",
      slug: "recommended",
      courseCount: 0
    });
  }

  // Handle scroll events to show/hide navigation arrows
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

    // Show left arrow if scrolled to the right
    setShowLeftArrow(scrollLeft > 0);

    // Show right arrow if there's more content to scroll to
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10); // 10px buffer
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();

      // Check after content might have changed
      setTimeout(handleScroll, 100);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Scroll active category into view when it changes
  useEffect(() => {
    if (activeButtonRef && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
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

      // Update arrow visibility after scrolling
      setTimeout(handleScroll, 300);
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

  // Scroll left/right when arrows are clicked
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({
      left: -200,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({
      left: 200,
      behavior: 'smooth'
    });
  };

  const loading = categoriesLoading && !customCategories;

  if (loading) {
    return (
      <div className={cn("flex gap-2 py-2", className)}>
        {Array(2).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 py-2 overflow-x-auto no-scrollbar"
      >
        {/* Fixed pills: All and Recommended */}
        {fixedCategories.map((category) => (
          <Button
            key={category.slug}
            ref={currentCategory === category.slug ? (btn) => setActiveButtonRef(btn) : undefined}
            variant={currentCategory === category.slug ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full whitespace-nowrap transition-all duration-300 flex-shrink-0",
              currentCategory === category.slug && "shadow-md",
              category.slug === 'recommended' && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
              category.slug === 'recommended' && currentCategory !== 'recommended' && "hover:text-white"
            )}
            onClick={() => handleCategoryClick(category.slug)}
          >
            {category.name}
          </Button>
        ))}

        {/* Dynamic category pills from courses */}
        {deduplicatedCategories.map((category) => (
          <Button
            key={category.slug}
            ref={currentCategory === category.slug ? (btn) => setActiveButtonRef(btn) : undefined}
            variant={currentCategory === category.slug ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full whitespace-nowrap transition-all duration-300 flex-shrink-0",
              currentCategory === category.slug && "shadow-md"
            )}
            onClick={() => handleCategoryClick(category.slug)}
          >
            {category.name}
            <span className="ml-1 text-xs opacity-70">({category.courseCount})</span>
          </Button>
        ))}
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
          onClick={scrollRight}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
