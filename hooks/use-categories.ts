'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { useEffect, useState } from 'react';

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
  const supabase = useSupabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default fallback categories in case the database query fails
  // Only include "All" by default, other categories will be populated based on actual courses
  const fallbackCategories: Category[] = [
    { id: "all", name: "All", slug: "all", courseCount: 0 }
  ];

  useEffect(() => {
    async function fetchCategories() {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setCategories(fallbackCategories);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if the categories table exists by making a small query
        const { data: tableCheck, error: tableError } = await supabase
          .from('categories')
          .select('id')
          .limit(1);

        // If there's an error with the table, use fallback categories
        if (tableError) {
          console.error('Categories table may not exist:', tableError);
          setCategories(fallbackCategories);
          setError('Categories table not available');
          setLoading(false);
          return;
        }

        // If the table exists, proceed with the full query
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description, icon, color, course_count')
          .order('course_count', { ascending: false });

        if (error) {
          console.error('Error in Supabase query:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log('No categories found in database, using fallbacks');
          setCategories(fallbackCategories);
        } else {
          const mappedCategories: Category[] = data.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            color: category.color,
            courseCount: category.course_count || 0
          }));

          setCategories(mappedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Use fallback categories when there's an error
        setCategories(fallbackCategories);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [supabase]);

  return {
    categories,
    loading,
    error
  };
}
