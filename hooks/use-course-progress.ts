'use client';

import { useState, useEffect } from 'react';
import { Course, getTotalLessons } from '@/types/course';

const STORAGE_KEY = 'course-progress';

interface CourseProgress {
  videoId: string;
  currentLessonIndex: number;
  completedLessons: number[];
  lastAccessedAt: number;
}

interface UseCourseProgressReturn {
  currentLessonIndex: number;
  setCurrentLessonIndex: (index: number) => void;
  completedLessons: number[];
  progress: number;
  markLessonComplete: (lessonIndex: number) => void;
  isLessonComplete: (lessonIndex: number) => boolean;
}

export function useCourseProgress(
  videoId: string,
  course: Course
): UseCourseProgressReturn {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const totalLessons = getTotalLessons(course);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed: Record<string, CourseProgress> = JSON.parse(savedProgress);
        if (parsed[videoId]) {
          const { currentLessonIndex, completedLessons } = parsed[videoId];
          setCurrentLessonIndex(currentLessonIndex);
          setCompletedLessons(completedLessons);
        }
      } catch (error) {
        console.error('Error loading course progress:', error);
      }
    }
  }, [videoId]);

  // Save progress to localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    const allProgress: Record<string, CourseProgress> = savedProgress 
      ? JSON.parse(savedProgress) 
      : {};

    allProgress[videoId] = {
      videoId,
      currentLessonIndex,
      completedLessons,
      lastAccessedAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  }, [videoId, currentLessonIndex, completedLessons]);

  // Update progress percentage
  useEffect(() => {
    const percentage = Math.round((completedLessons.length / totalLessons) * 100);
    setProgress(percentage);
  }, [completedLessons.length, totalLessons]);

  const markLessonComplete = (lessonIndex: number) => {
    if (!completedLessons.includes(lessonIndex)) {
      setCompletedLessons(prev => [...prev, lessonIndex].sort((a, b) => a - b));
    }
  };

  const isLessonComplete = (lessonIndex: number) => {
    return completedLessons.includes(lessonIndex);
  };

  return {
    currentLessonIndex,
    setCurrentLessonIndex,
    completedLessons,
    progress,
    markLessonComplete,
    isLessonComplete
  };
}