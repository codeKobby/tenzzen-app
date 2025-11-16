'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  thumbnail: string;
}

export interface LearningActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

export interface UserStats {
  totalCourses: number;
  completedCourses: number;
  totalLearningTime: number;
  averageScore: number;
}

export function useUserStats() {
  const { user } = useUser();
  const stats = useQuery(api.dashboard.getUserStats, user?.id ? { userId: user.id } : 'skip');

  if (!user?.id) {
    return {
      userStats: {
        totalCourses: 0,
        completedCourses: 0,
        totalLearningTime: 0,
        averageScore: 0
      },
      loading: false
    };
  }

  return {
    userStats: stats ? {
      totalCourses: stats.enrollmentStats.totalEnrolled,
      completedCourses: stats.enrollmentStats.completedCourses,
      totalLearningTime: 0, // TODO: Calculate from lesson progress
      averageScore: 0 // TODO: Calculate from quiz results
    } : {
      totalCourses: 0,
      completedCourses: 0,
      totalLearningTime: 0,
      averageScore: 0
    },
    loading: !stats
  };
}

export function useRecentCourses(limit: number = 5) {
  const { user } = useUser();
  const courses = useQuery(api.dashboard.getRecentCourses, user?.id ? { userId: user.id, limit } : 'skip');

  if (!user?.id) {
    return {
      recentCourses: [],
      loading: false
    };
  }

  return {
    recentCourses: courses ? courses.filter(course => course !== null).map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      progress: course.enrollment?.progress ?? 0,
      thumbnail: course.sourceUrl || '' // TODO: Add thumbnail field
    })) : [],
    loading: !courses
  };
}

export function useRecentActivities(limit: number = 10) {
  const { user } = useUser();
  const stats = useQuery(api.dashboard.getUserStats, user?.id ? { userId: user.id } : 'skip');

  if (!user?.id) {
    return {
      activities: [],
      loading: false
    };
  }

  return {
    activities: stats ? stats.recentActivities.slice(0, limit).map(activity => ({
      id: `${activity.type}-${activity.createdAt}`,
      type: activity.type,
      title: getActivityTitle(activity),
      timestamp: activity.createdAt
    })) : [],
    loading: !stats
  };
}

export function useLearningTrends(period: string = '30d') {
  const { user } = useUser();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const activity = useQuery(api.dashboard.getLearningActivity, user?.id ? { userId: user.id, days } : 'skip');

  if (!user?.id) {
    return {
      trends: [],
      loading: false
    };
  }

  return {
    trends: activity ? Object.entries(activity).map(([date, count]) => ({
      date,
      value: count
    })) : [],
    loading: !activity
  };
}

// Helper function to get activity title
function getActivityTitle(activity: any): string {
  switch (activity.type) {
    case 'course_enrolled':
      return 'Enrolled in a course';
    case 'lesson_completed':
      return 'Completed a lesson';
    case 'quiz_attempted':
      return 'Attempted a quiz';
    case 'course_generated':
      return 'Generated a course';
    case 'login':
      return 'Logged in';
    default:
      return 'Activity';
  }
}
