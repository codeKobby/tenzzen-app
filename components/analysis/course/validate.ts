import type { CourseGeneratorResult } from "@/tools/courseGenerator";

type Section = CourseGeneratorResult['sections'][0];
type Lesson = Section['lessons'][0];

export function validateCourseData(data: any): CourseGeneratorResult | null {
  try {
    // Basic structural validation
    if (!data || typeof data !== 'object') {
      console.error('Invalid course data: not an object', data);
      return null;
    }

    // Required top-level fields
    const requiredFields = ['title', 'subtitle', 'overview', 'sections'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Invalid course data: missing ${field}`, data);
        return null;
      }
    }

    // Overview validation
    const requiredOverviewFields = [
      'description',
      'prerequisites',
      'learningOutcomes',
      'totalDuration',
      'difficultyLevel',
      'skills',
      'tools'
    ];

    for (const field of requiredOverviewFields) {
      if (!(field in data.overview)) {
        console.error(`Invalid course data: missing overview.${field}`, data);
        return null;
      }
    }

    // Sections validation
    if (!Array.isArray(data.sections)) {
      console.error('Invalid course data: sections is not an array', data);
      return null;
    }

    // Process each section
    data.sections = data.sections.map((section: Partial<Section>, index: number) => ({
      ...section,
      id: section.id || `s${index + 1}`,
      lessons: Array.isArray(section.lessons) ? section.lessons.map((lesson: Partial<Lesson>, lessonIndex: number) => ({
        ...lesson,
        id: lesson.id || `l${index + 1}.${lessonIndex + 1}`,
        isLocked: lesson.isLocked ?? false,
        resources: Array.isArray(lesson.resources) ? lesson.resources : [],
        test: lesson.test ? {
          ...lesson.test,
          id: lesson.test.id || `t${index + 1}.${lessonIndex + 1}`,
          isLocked: lesson.test.isLocked ?? true
        } : null
      })) : []
    }));

    console.log('Course data validated successfully:', {
      title: data.title,
      sectionsCount: data.sections.length,
      lessonsCount: data.sections.reduce(
        (acc: number, section: Section) => acc + section.lessons.length,
        0
      )
    });

    return data as CourseGeneratorResult;
  } catch (error) {
    console.error('Error validating course data:', error);
    return null;
  }
}

export function getSummary(data: CourseGeneratorResult) {
  const lessonsCount = data.sections.reduce(
    (acc: number, section: Section) => acc + section.lessons.length,
    0
  );
  
  const testsCount = data.sections.reduce(
    (acc: number, section: Section) => 
      acc + section.lessons.reduce(
        (lacc: number, lesson: Lesson) => lacc + (lesson.test ? 1 : 0),
        0
      ),
    0
  );

  const resourcesCount = data.sections.reduce(
    (acc: number, section: Section) => 
      acc + section.lessons.reduce(
        (lacc: number, lesson: Lesson) => lacc + lesson.resources.length,
        0
      ),
    0
  );

  return {
    sections: data.sections.length,
    lessons: lessonsCount,
    tests: testsCount,
    resources: resourcesCount,
    difficulty: data.overview.difficultyLevel,
    duration: data.overview.totalDuration
  };
}