import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Updates category counts in the database
 * This should be called whenever courses are added, updated, or deleted
 */
export async function updateCategoryCounts(supabase: SupabaseClient) {
  try {
    // First, get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, slug');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return false;
    }

    // For each category, count the number of courses
    for (const category of categories) {
      // Count courses in this category
      const { count, error: countError } = await supabase
        .from('course_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) {
        console.error(`Error counting courses for category ${category.slug}:`, countError);
        continue;
      }

      // Update the category count
      const { error: updateError } = await supabase
        .from('categories')
        .update({ course_count: count || 0 })
        .eq('id', category.id);

      if (updateError) {
        console.error(`Error updating count for category ${category.slug}:`, updateError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating category counts:', error);
    return false;
  }
}

/**
 * Refreshes all category counts by recounting all courses
 * This is useful for fixing inconsistencies in the database
 */
export async function refreshAllCategoryCounts(supabase: SupabaseClient) {
  try {
    // Get all categories from the database
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return false;
    }

    // For each category, count the associated courses
    const updates = categories.map(async (category) => {
      // Count courses in this category using the junction table
      const { count, error: countError } = await supabase
        .from('course_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) {
        console.error(`Error counting courses for category ${category.slug}:`, countError);
        return null;
      }

      // Update the category count
      const { error: updateError } = await supabase
        .from('categories')
        .update({ course_count: count || 0 })
        .eq('id', category.id);

      if (updateError) {
        console.error(`Error updating count for category ${category.slug}:`, updateError);
        return null;
      }

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: count || 0
      };
    });

    // Wait for all updates to complete
    const results = await Promise.all(updates);
    
    // Filter out null results (errors)
    const successfulUpdates = results.filter(Boolean);
    
    return {
      success: true,
      updatedCategories: successfulUpdates
    };
  } catch (error) {
    console.error('Error refreshing category counts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
