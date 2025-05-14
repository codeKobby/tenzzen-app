import { Course } from '@/app/courses/types';

/**
 * Configuration for trending courses algorithm
 */
interface TrendingCoursesConfig {
  // Minimum number of total courses required to show trending section
  minTotalCourses: number;
  // Minimum number of enrollments for a course to be considered trending
  minEnrollments: number;
  // Maximum number of trending courses to display
  maxTrendingCourses: number;
  // Weight for enrollment count in trending score calculation (0-1)
  enrollmentWeight: number;
  // Weight for recency in trending score calculation (0-1)
  recencyWeight: number;
}

/**
 * Default configuration for trending courses
 */
const DEFAULT_TRENDING_CONFIG: TrendingCoursesConfig = {
  minTotalCourses: 5,
  minEnrollments: 3,
  maxTrendingCourses: 4,
  enrollmentWeight: 0.7,
  recencyWeight: 0.3,
};

/**
 * Configuration for course recommendations algorithm
 */
interface RecommendationConfig {
  // Minimum number of courses the user has interacted with to show recommendations
  minUserCourseInteractions: number;
  // Maximum number of recommended courses to display
  maxRecommendedCourses: number;
  // Weight for category matching in recommendation score (0-1)
  categoryMatchWeight: number;
  // Weight for content similarity in recommendation score (0-1)
  contentSimilarityWeight: number;
  // Weight for popularity in recommendation score (0-1)
  popularityWeight: number;
}

/**
 * Default configuration for course recommendations
 */
const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  minUserCourseInteractions: 2,
  maxRecommendedCourses: 4,
  categoryMatchWeight: 0.5,
  contentSimilarityWeight: 0.3,
  popularityWeight: 0.2,
};

/**
 * User learning history for recommendation algorithm
 */
interface UserLearningHistory {
  // Courses the user has enrolled in
  enrolledCourses: Course[];
  // Categories the user has shown interest in
  interestedCategories: string[];
  // Total learning time in hours
  totalLearningHours?: number;
  // User's completed courses
  completedCourses?: Course[];
}

/**
 * Result of the trending courses algorithm
 */
interface TrendingCoursesResult {
  // Whether to show the trending section
  showTrendingSection: boolean;
  // Trending courses to display
  trendingCourses: Course[];
}

/**
 * Result of the recommendation algorithm
 */
interface RecommendationResult {
  // Whether to show the recommendations section
  showRecommendations: boolean;
  // Recommended courses to display
  recommendedCourses: Course[];
}

/**
 * Calculate trending score for a course
 * @param course Course to calculate score for
 * @param config Configuration for trending algorithm
 * @returns Trending score (higher is more trending)
 */
function calculateTrendingScore(course: Course, config: TrendingCoursesConfig): number {
  const enrollmentScore = course.enrolledCount || 0;
  
  // Calculate recency score (0-1) based on last updated date
  // More recent courses get higher scores
  let recencyScore = 0;
  if (course.lastAccessed) {
    const now = new Date();
    const lastUpdated = new Date(course.lastAccessed);
    const ageInDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    // Newer courses (less days old) get higher scores
    recencyScore = Math.max(0, 1 - (ageInDays / 30)); // Normalize to 0-1 over 30 days
  }
  
  // Calculate weighted score
  return (
    (enrollmentScore * config.enrollmentWeight) + 
    (recencyScore * config.recencyWeight)
  );
}

/**
 * Determines which courses to show in the trending section
 * @param allCourses All available courses
 * @param config Configuration for trending algorithm
 * @returns Result containing trending courses and whether to show the section
 */
export function getTrendingCourses(
  allCourses: Course[],
  config: TrendingCoursesConfig = DEFAULT_TRENDING_CONFIG
): TrendingCoursesResult {
  // Don't show trending section if there aren't enough total courses
  if (allCourses.length < config.minTotalCourses) {
    return {
      showTrendingSection: false,
      trendingCourses: [],
    };
  }
  
  // Filter courses that meet minimum enrollment threshold
  const eligibleCourses = allCourses.filter(
    course => (course.enrolledCount || 0) >= config.minEnrollments
  );
  
  // Don't show trending if not enough eligible courses
  if (eligibleCourses.length < 2) {
    return {
      showTrendingSection: false,
      trendingCourses: [],
    };
  }
  
  // Calculate trending score for each eligible course
  const scoredCourses = eligibleCourses.map(course => ({
    course,
    score: calculateTrendingScore(course, config),
  }));
  
  // Sort by trending score (descending)
  scoredCourses.sort((a, b) => b.score - a.score);
  
  // Take top N courses
  const trendingCourses = scoredCourses
    .slice(0, config.maxTrendingCourses)
    .map(item => item.course);
  
  return {
    showTrendingSection: trendingCourses.length > 0,
    trendingCourses,
  };
}

/**
 * Calculate recommendation score for a course based on user history
 * @param course Course to calculate score for
 * @param userHistory User's learning history
 * @param config Configuration for recommendation algorithm
 * @returns Recommendation score (higher is more recommended)
 */
function calculateRecommendationScore(
  course: Course,
  userHistory: UserLearningHistory,
  config: RecommendationConfig
): number {
  // Category match score (0-1)
  let categoryMatchScore = 0;
  if (course.category && userHistory.interestedCategories.includes(course.category)) {
    categoryMatchScore = 1;
  }
  
  // Content similarity score (0-1)
  // This is a simplified version - in a real system, you'd use more sophisticated
  // content-based filtering or collaborative filtering
  let contentSimilarityScore = 0;
  const userCourseCategories = userHistory.enrolledCourses
    .map(c => c.category)
    .filter(Boolean) as string[];
  
  if (course.category && userCourseCategories.includes(course.category)) {
    contentSimilarityScore = 1;
  }
  
  // Popularity score (0-1)
  // Normalize enrollment count to 0-1 scale (assuming max enrollment of 1000)
  const popularityScore = Math.min(1, (course.enrolledCount || 0) / 1000);
  
  // Calculate weighted score
  return (
    (categoryMatchScore * config.categoryMatchWeight) +
    (contentSimilarityScore * config.contentSimilarityWeight) +
    (popularityScore * config.popularityWeight)
  );
}

/**
 * Determines which courses to show in the recommendations section
 * @param allCourses All available courses
 * @param userHistory User's learning history
 * @param config Configuration for recommendation algorithm
 * @returns Result containing recommended courses and whether to show the section
 */
export function getRecommendedCourses(
  allCourses: Course[],
  userHistory: UserLearningHistory,
  config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG
): RecommendationResult {
  // Don't show recommendations if user hasn't interacted with enough courses
  if (userHistory.enrolledCourses.length < config.minUserCourseInteractions) {
    return {
      showRecommendations: false,
      recommendedCourses: [],
    };
  }
  
  // Filter out courses the user is already enrolled in
  const enrolledCourseIds = userHistory.enrolledCourses.map(course => course.id);
  const unenrolledCourses = allCourses.filter(
    course => !enrolledCourseIds.includes(course.id)
  );
  
  // Don't show recommendations if not enough unenrolled courses
  if (unenrolledCourses.length === 0) {
    return {
      showRecommendations: false,
      recommendedCourses: [],
    };
  }
  
  // Calculate recommendation score for each unenrolled course
  const scoredCourses = unenrolledCourses.map(course => ({
    course,
    score: calculateRecommendationScore(course, userHistory, config),
  }));
  
  // Sort by recommendation score (descending)
  scoredCourses.sort((a, b) => b.score - a.score);
  
  // Take top N courses
  const recommendedCourses = scoredCourses
    .slice(0, config.maxRecommendedCourses)
    .map(item => item.course);
  
  return {
    showRecommendations: recommendedCourses.length > 0,
    recommendedCourses,
  };
}
