"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/custom-toast";
import { useCoursePanelContext } from "@/components/analysis/course-panel-context";
import { formatDurationFromSeconds, formatDurationHumanReadable } from "@/lib/utils/duration";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  X,
  Play,
  Bookmark,
  GraduationCap,
  Clock,
  BookOpen,
  FileText,
  TestTube2,
  XCircle,
  Tag,
  ChevronDown,
  Lock,
  FileQuestion,
  Code,
  Briefcase,
  CheckCircle2,
  ArrowUp, Loader2, FileCode, Link, Book, Newspaper, Youtube, ExternalLink, BrainCircuit, FileQuestionIcon, ClipboardCheck, Trophy, ListChecks, Lightbulb, Wrench, Film, BookCopy, TagIcon, LinkIcon, Info, Target, Github, Twitter, Linkedin, Globe, Instagram, Facebook, MessageCircle
} from "lucide-react";
import { ClockIcon } from "lucide-react";
import type { ContentDetails } from "@/types/youtube";

const GENERIC_CATEGORY_PLACEHOLDERS = [
  "General",
  "Programming Fundamentals",
  "Programming",
  "Uncategorized",
  "Other",
  "Miscellaneous"
];

function resolveCategoryLabel(
  rawCategory?: string | null,
  tags?: string[] | null,
  fallback: string = "General"
) {
  const sanitizedCategory = rawCategory?.trim();
  if (sanitizedCategory && !GENERIC_CATEGORY_PLACEHOLDERS.includes(sanitizedCategory)) {
    return sanitizedCategory;
  }

  if (tags && tags.length > 0) {
    const meaningfulTag = tags.find((tag) => {
      if (!tag) return false;
      const normalized = tag.trim();
      return normalized.length > 0 && !GENERIC_CATEGORY_PLACEHOLDERS.includes(normalized);
    });
    if (meaningfulTag) {
      return meaningfulTag.trim();
    }
  }

  return sanitizedCategory || fallback;
}

// --- Helper to normalize AI output ---
function normalizeCourseData(
  raw: any,
  initialVideoData: ContentDetails | null
) {
  console.log("[Normalize] Starting normalization with raw:", raw ? "Present" : "Not present");
  console.log("[Normalize] Starting normalization with initialVideoData:", initialVideoData ? "Present" : "Not present");

  // Log the raw data keys if available
  if (raw) {
    console.log("[Normalize] Raw data keys:", Object.keys(raw));
    console.log("[Normalize] Raw sourceId:", raw.sourceId);
    console.log("[Normalize] Raw modules:", raw.modules ? "Present" : "Not present");
  }

  // Log the initialVideoData keys if available
  if (initialVideoData) {
    console.log("[Normalize] InitialVideoData keys:", Object.keys(initialVideoData));
    console.log("[Normalize] InitialVideoData id:", initialVideoData.id);
  }

  if (!raw && !initialVideoData) {
    console.log("[Normalize] Both raw and initialVideoData are missing, returning default data");
    return {
      title: "Loading Course...",
      description: "",
      image: "/placeholders/course-thumbnail.jpg",
      videoId: "",
      metadata: {
        category: "General", tags: [], difficulty: "N/A", prerequisites: [], objectives: [], overviewText: "", resources: [], duration: "", sources: []
      },
      courseItems: [],
      project: null,
      creatorResources: [],
      creatorSocials: []
    };
  }

  console.log("[Normalize] Input raw (generated):", raw);
  console.log("[Normalize] Input initialVideoData:", initialVideoData);

  // Handle Convex course structure (has modules array)
  if (raw?.modules && Array.isArray(raw.modules)) {
    console.log("[Normalize] Detected Convex course structure");

    const videoId = raw.sourceId || initialVideoData?.id || "";
    const title = raw.title || initialVideoData?.title || "Generated Course";
    const description = raw.description || "";
    const image = raw.sourceUrl || initialVideoData?.thumbnail || "/placeholders/course-thumbnail.jpg";

    // Build sources
    let sources: any[] = [];
    if (initialVideoData?.channelName) {
      sources.push({
        name: initialVideoData.channelName,
        avatar: initialVideoData.channelAvatar || '/placeholder-avatar.png',
        type: 'youtube_channel'
      });
    }

    // Convert Convex modules to courseItems format with assessment placeholders
    const courseItems: any[] = [];

    raw.modules.forEach((module: any, moduleIndex: number) => {
      // Add module section
      courseItems.push({
        type: 'section',
        title: module.title || `Module ${moduleIndex + 1}`,
        description: module.description || "",
        lessons: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
          id: lesson._id || `lesson-${moduleIndex}-${lessonIndex}`,
          title: lesson.title || `Lesson ${lessonIndex + 1}`,
          description: lesson.description || "",
          durationMinutes: lesson.durationMinutes,
          timestampStart: lesson.timestampStart,
          timestampEnd: lesson.timestampEnd,
          keyPoints: lesson.keyPoints || [],
        })),
        objective: module.description || undefined,
        keyPoints: [],
      });

      // Check if there's a quiz after this module
      if (raw.assessmentPlan?.quizLocations) {
        const quizAfterModule = raw.assessmentPlan.quizLocations.find(
          (q: any) => q.afterModule === moduleIndex
        );
        if (quizAfterModule) {
          courseItems.push({
            type: 'assessment_placeholder',
            assessmentType: 'quiz',
          });
        }
      }
    });

    // Add end-of-course test if specified
    if (raw.assessmentPlan?.hasEndOfCourseTest) {
      courseItems.push({
        type: 'assessment_placeholder',
        assessmentType: 'test',
      });
    }

    // Prepare final project placeholder
    const project = raw.assessmentPlan?.hasFinalProject ? {
      type: 'assessment_placeholder',
      assessmentType: 'project',
      description: raw.assessmentPlan.projectDescription
    } : null;

    const metadata = {
      category: resolveCategoryLabel(raw.category, raw.tags),
      difficulty: raw.difficulty || "Beginner",
      tags: raw.tags || [],
      prerequisites: raw.prerequisites || [],
      objectives: raw.learningObjectives || [],
      overviewText: raw.detailedOverview || raw.description || "",
      resources: raw.resources || [],
      duration: raw.estimatedDuration || (initialVideoData && initialVideoData.type === "video" ? initialVideoData.duration : "Variable duration"),
      sources: sources,
    };

    return {
      _id: raw._id, // Include Convex ID
      title,
      description,
      image,
      videoId,
      metadata,
      courseItems,
      project,
      resources: raw.resources || [], // Resources with category field
    };
  }

  // Original format handling...
  const title = initialVideoData?.title || raw?.title || raw?.course_title || "Generated Course";
  const description = raw?.description || initialVideoData?.description || "";

  // Ensure we have a videoId - this is critical for the course panel to display correctly
  let videoId = initialVideoData?.id || raw?.videoId || raw?.id || "";
  console.log("[Normalize] Extracted videoId:", videoId);

  // If we still don't have a videoId but have raw data, this is likely an issue
  if (!videoId && raw) {
    console.warn("[Normalize] Missing videoId in both raw and initialVideoData, but raw data exists");
    console.warn("[Normalize] Raw data keys:", Object.keys(raw));
    // Try to extract from any possible location
    if (raw._id) videoId = raw._id;
    else if (raw.video_id) videoId = raw.video_id;
  }
  const image = initialVideoData?.thumbnail || raw?.thumbnail || raw?.image || raw?.metadata?.thumbnail || "/placeholders/course-thumbnail.jpg";

  let sources: any[] = [];
  // Use correct properties: channelName and channelAvatar (optional)
  if (initialVideoData?.channelName) {
    sources.push({
      name: initialVideoData.channelName,
      avatar: initialVideoData.channelAvatar || '/placeholder-avatar.png',
      type: 'youtube_channel'
    });
  }
  const aiSources = raw?.metadata?.sources || [];
  aiSources.forEach((aiSource: any) => {
    if (aiSource?.name && !sources.some(s => s.name === aiSource.name)) {
      sources.push({
        name: aiSource.name,
        avatar: aiSource.avatar || '/placeholder-avatar.png',
        type: aiSource.type || 'ai_generated'
      });
    }
  });

  const metadataBase = {
    category: "General",
    tags: [],
    difficulty: "N/A",
    prerequisites: [],
    objectives: [],
    overviewText: "",
    resources: [],
    duration: "Variable duration",
    sources: sources,
    ...(raw?.metadata || {}),
  };

  // Get duration from YouTube video data if available (only VideoDetails has duration)
  let duration = metadataBase.duration;
  if (initialVideoData?.type === "video" && initialVideoData.duration) {
    duration = initialVideoData.duration;
  } else if (metadataBase.duration === "Variable duration" && raw?.estimated_duration) {
    duration = raw.estimated_duration;
  }

  const normalizedTags = Array.isArray(raw?.tags) ? raw.tags : (metadataBase.tags || []);

  const metadata = {
    ...metadataBase,
    category: resolveCategoryLabel(metadataBase.category, normalizedTags),
    difficulty: metadataBase.difficulty === "N/A" && raw?.difficulty_level ? raw.difficulty_level : metadataBase.difficulty,
    prerequisites: Array.isArray(raw?.prerequisites) ? raw.prerequisites : (metadataBase.prerequisites || []),
    objectives: Array.isArray(raw?.learning_objectives) ? raw.learning_objectives : (metadataBase.objectives || []),
    duration: duration,
    resources: Array.isArray(raw?.resources) ? raw.resources : (metadataBase.resources || []), // Expect resources at top level now
    overviewText: raw?.overviewText || raw?.metadata?.overviewText || metadataBase.overviewText || "",
    tags: normalizedTags,
    sources: sources, // Ensure sources are correctly assigned
  };

  const courseItems = (raw?.courseItems || []).map((item: any) => {
    if (item.type === 'section') {
      let lessons: any[] = [];
      if (Array.isArray(item.lessons)) {
        lessons = item.lessons.map((lesson: any) => ({
          id: lesson.id || undefined,
          title: lesson.title || "Untitled Lesson",
          description: lesson.description || "",
          durationMinutes: lesson.durationMinutes || undefined,
          timestampStart: lesson.timestampStart || undefined,
          timestampEnd: lesson.timestampEnd || undefined,
          keyPoints: lesson.keyPoints || [],
        }));
      }
      return {
        type: 'section',
        title: item.title || "Untitled Section",
        description: item.description || "",
        lessons: lessons,
        objective: item.objective || undefined,
        keyPoints: item.keyPoints || [],
      };
    } else if (item.type === 'assessment_placeholder') {
      return {
        type: 'assessment_placeholder',
        assessmentType: item.assessmentType || 'quiz',
      };
    }
    return null;
  }).filter(Boolean);

  let projectPlaceholder = raw?.project && raw.project.type === 'assessment_placeholder' && raw.project.assessmentType === 'project'
    ? { type: 'assessment_placeholder', assessmentType: 'project' }
    : null;

  // Ensure resource arrays exist and have default fields if needed (basic check)
  const ensureResourceDefaults = (resources: any[]) => {
    return (resources || []).map((res: any, index: number) => ({
      title: res?.title || `Resource ${index + 1}`,
      description: res?.description || "No description available.",
      url: res?.url || "",
      type: res?.type || "Website",
      category: res?.category || "Other Resources", // Default to Other Resources
    }));
  };

  const normalizedResult = {
    title,
    description,
    image,
    videoId,
    metadata,
    courseItems,
    project: projectPlaceholder,
    resources: ensureResourceDefaults(raw?.resources), // Resources with category field
  };

  console.log("[Normalize] Final normalized data:", JSON.stringify(normalizedResult, null, 2));
  return normalizedResult;
}

// --- Action Buttons ---
function ActionButtons({ className, course }: { className?: string, course: any }) {
  const { handleEnroll, handleCancel, isEnrolling } = useCoursePanelContext();

  const onEnrollClick = () => {
    console.log("[ActionButtons] Enroll button clicked with course:", course);
    if (course) {
      handleEnroll(course);
    } else {
      console.error("[ActionButtons] Cannot enroll - course data is missing");
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        className="gap-1.5"
        size="default"
        onClick={onEnrollClick}
        disabled={isEnrolling}
      >
        {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Start Course
      </Button>
    </div>
  );
}

// --- Course Summary ---
function CourseSummary({ course }: { course: any }) {
  const totalLessons = course.total_lessons || course.courseItems
    ?.filter((item: any) => item.type === 'section')
    .reduce((acc: number, section: any) => acc + (section.lessons?.length || 0), 0) || 0;

  const socialGroups = useMemo(() => {
    const socials = (course.metadata?.resources || []).filter((r: any) => r.category === "Social");
    if (!socials.length) return [] as Array<[string, any[]]>;

    const grouped = socials.reduce((acc: Record<string, any[]>, link: any) => {
      const platform = detectSocialPlatform(link?.title, link?.url) || "website";
      if (!acc[platform]) acc[platform] = [];
      acc[platform].push(link);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [course.metadata?.resources]);

  const displayCategory = useMemo(() => {
    return resolveCategoryLabel(course.metadata?.category, course.metadata?.tags || []);
  }, [course.metadata?.category, course.metadata?.tags]);

  return (
    <div className="flex flex-col gap-3">
      {/* Category & Difficulty */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {displayCategory && (
          <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-0.5">
            {displayCategory}
          </Badge>
        )}
        {course.metadata?.difficulty && course.metadata.difficulty !== 'N/A' && (
          <Badge variant="outline" className={cn(
            "border-border/70 px-2.5 py-0.5",
            course.metadata.difficulty === 'Beginner' && "text-green-700 border-green-200 bg-green-50 dark:text-green-200 dark:border-green-700/30 dark:bg-green-900/30",
            course.metadata.difficulty === 'Intermediate' && "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-200 dark:border-amber-700/30 dark:bg-amber-900/30",
            course.metadata.difficulty === 'Advanced' && "text-red-700 border-red-200 bg-red-50 dark:text-red-200 dark:border-red-700/30 dark:bg-red-900/30"
          )}>
            {course.metadata.difficulty}
          </Badge>
        )}
      </div>

      {/* Tags - Display as pill badges */}
      {course.metadata?.tags && course.metadata.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {course.metadata.tags.map((tag: string, index: number) => (
            <Badge key={`tag-${index}`} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Sources */}
      {course.metadata?.sources && course.metadata.sources.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <span className="shrink-0 font-medium text-foreground/80">Source:</span>
          <div className="flex items-center shrink-0">
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center cursor-pointer">
                  {course.metadata.sources.slice(0, 3).map((source: any, i: number) => (
                    <TooltipProvider key={`${course.videoId}-source-${i}`} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "relative h-5 w-5 rounded-full overflow-hidden border-2 border-background transition-transform hover:z-10",
                              i > 0 && "-ml-1.5 hover:translate-x-0.5"
                            )}
                            aria-label={source.name}
                          >
                            <Image
                              src={source.avatar || '/placeholder-avatar.png'}
                              alt={source.name || 'Source'}
                              fill
                              className="object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png'; }}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{source.name || 'Unknown Source'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {course.metadata.sources.length > 3 && (
                    <div className="relative h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border-2 border-background -ml-1.5 hover:translate-x-0.5 hover:z-10 transition-transform">
                      +{course.metadata.sources.length - 3}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[90%] max-w-[250px] p-3 rounded-lg" side="bottom" align="start" sideOffset={5}>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium leading-none">Content Sources</h4>
                  <div className="space-y-3">
                    {course.metadata.sources.map((source: any, i: number) => (
                      <div key={`${course.videoId}-source-popover-${i}`} className="flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={source.avatar || '/placeholder-avatar.png'}
                            alt={source.name || 'Source'}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png'; }}
                          />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium leading-none">{source.name || 'Unknown Source'}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {source.type?.replace(/_/g, ' ') || 'Source'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* About (Uses top-level description for brief summary) */}
      <div>
        <h3 className="font-semibold text-lg mt-2">About this course</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-4">
          {/* Use top-level description, fallback if empty */}
          {course.description || "No description provided."}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mt-1">
        {course.duration_seconds ? (
          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>{formatDurationHumanReadable(course.duration_seconds)}</span></div>
        ) : course.metadata?.duration && course.metadata.duration !== "Variable duration" && (
          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>{course.metadata.duration}</span></div>
        )}
        <div className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /><span>{totalLessons} Lesson{totalLessons !== 1 ? 's' : ''}</span></div>
      </div>

      {/* Action buttons with social icons */}
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ActionButtons className="flex-1" course={course} />
        {socialGroups.length > 0 && (
          <div className="flex w-full flex-wrap justify-end gap-2 lg:w-auto">
            {socialGroups.map(([platform, links], index) => {
              const primaryLink = links[0];
              const icon = getGroupedSocialIcon(primaryLink?.title, primaryLink?.url);
              const label = getPlatformLabel(platform);

              if (links.length === 1) {
                const single = links[0];
                return (
                  <TooltipProvider key={`social-${platform}-${index}`} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          asChild
                        >
                          <a
                            href={single.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={single.title || label}
                          >
                            {icon}
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{single.title || label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return (
                <Popover key={`social-${platform}-${index}`}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-9 w-9 shrink-0"
                      aria-label={`View ${links.length} ${label} links`}
                    >
                      {icon}
                      <Badge variant="secondary" className="absolute -right-1 -top-1 px-1.5 py-0 text-[10px] leading-none">
                        {links.length}
                      </Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 rounded-lg" align="end" sideOffset={6}>
                    <div className="space-y-2 text-left">
                      <p className="text-sm font-medium">{label} links</p>
                      <div className="space-y-1.5">
                        {links.map((link: any, linkIndex: number) => (
                          <a
                            key={`${platform}-link-${linkIndex}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-primary hover:bg-muted"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="truncate">{link.title || formatSocialLinkText(link.url)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Icon Helpers ---
const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  discord: "Discord",
  telegram: "Telegram",
  website: "Website",
  blog: "Blog",
  newsletter: "Newsletter",
  "link-collection": "Links"
};

function detectSocialPlatform(title?: string, url?: string) {
  const value = `${title ?? ""} ${url ?? ""}`.toLowerCase();

  if (value.includes("github")) return "github";
  if (value.includes("twitter") || value.includes("x.com")) return "twitter";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook")) return "facebook";
  if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("discord")) return "discord";
  if (value.includes("telegram")) return "telegram";
  if (value.includes("substack")) return "newsletter";
  if (value.includes("medium")) return "blog";
  if (value.includes("linktree")) return "link-collection";
  return "website";
}

function getGroupedSocialIcon(title?: string, url?: string) {
  const platform = detectSocialPlatform(title, url);
  switch (platform) {
    case "github":
      return <Github className="h-4 w-4" />;
    case "twitter":
      return <Twitter className="h-4 w-4" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4" />;
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "youtube":
      return <Youtube className="h-4 w-4" />;
    case "tiktok":
    case "discord":
    case "telegram":
      return <MessageCircle className="h-4 w-4" />;
    case "blog":
    case "newsletter":
      return <FileText className="h-4 w-4" />;
    case "link-collection":
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

function getPlatformLabel(platform: string) {
  return PLATFORM_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
}

function formatSocialLinkText(url?: string) {
  if (!url) return "View";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

const ResourceTypeIconMap: Record<string, React.ElementType> = { // Define Resource Icon Map
  book: Book, article: BookCopy, tool: Wrench, video: Film, website: LinkIcon, tutorial: Lightbulb, other: LinkIcon, code: Code, documentation: FileText, practice: TestTube2, patreon: Bookmark // Added more specific types
};
function getResourceIcon(resource: any) { // Define Resource Icon Helper
  // Prioritize 'type' field for icon mapping
  const type = (resource?.type || 'other').toLowerCase(); // Use 'other' as fallback
  const IconComponent = ResourceTypeIconMap[type] || LinkIcon; // Default to LinkIcon if type not mapped
  return <IconComponent className="h-4 w-4 text-muted-foreground" />;
}

const getAssessmentIcon = (type?: string) => { // Define Assessment Icon Helper
  switch (type?.toLowerCase()) {
    case 'quiz': case 'test': return <FileQuestionIcon className="h-5 w-5 text-blue-500" />;
    case 'assignment': return <ClipboardCheck className="h-5 w-5 text-green-500" />;
    case 'project': return <Trophy className="h-5 w-5 text-amber-500" />;
    default: return <FileQuestion className="h-5 w-5 text-gray-500" />;
  }
};


// --- Lesson Item Component ---
function LessonItem({ lesson, sectionItemIndex, lessonIndex }: { lesson: any, sectionItemIndex: number, lessonIndex: number }) {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const toggleDescription = () => setIsDescriptionVisible(!isDescriptionVisible);

  // Display timestamp range if available
  const hasTimestamps = lesson.timestampStart && lesson.timestampEnd;

  return (
    <div key={`lesson-${sectionItemIndex}-${lessonIndex}`} className="py-2 px-2 rounded-md transition-colors group border-b border-border/40 last:border-b-0">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleDescription}>
        <div className="flex gap-3 items-center flex-1 min-w-0 mr-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]">{lessonIndex + 1}</div>
          <span className="text-sm font-medium truncate">{lesson.title || `Lesson ${lessonIndex + 1}`}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasTimestamps ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {lesson.timestampStart} - {lesson.timestampEnd}
            </span>
          ) : lesson.durationMinutes ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {lesson.durationMinutes} min
            </span>
          ) : null}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isDescriptionVisible && "rotate-180")} />
        </div>
      </div>
      {lesson.description && (
        <p className={cn("text-sm text-muted-foreground mt-2 pl-8 transition-all duration-300 ease-in-out overflow-hidden", isDescriptionVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
          {lesson.description}
        </p>
      )}
    </div>
  );
}

// --- TabContent Component ---
function TabContent({ tab, course }: { tab: string; course: any }) {
  console.log(`[TabContent] Rendering tab '${tab}' with course:`, course);
  // Social icons are rendered outside TabContent

  if (tab === "overview") {
    // Use detailedOverview for the detailed view in this tab.
    // The top-level description is the brief "About this course" summary
    const detailedOverview = course.metadata?.overviewText || course.detailedOverview || "No detailed overview available.";

    return (
      <div className="space-y-6">
        {/* Display the detailed overview text */}
        <div><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailedOverview}</p></div>

        {/* Creator Socials are NOT rendered here */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4 pt-4 border-t">
          {course.metadata?.objectives && course.metadata.objectives.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground/90">Learning Objectives</h3>
              <div className="space-y-2">
                {course.metadata.objectives.map((obj: string, index: number) => (
                  <div key={`obj-${index}`} className="flex items-start gap-3 py-1">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {course.metadata?.prerequisites && course.metadata.prerequisites.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground/90">Prerequisites</h3>
              <div className="space-y-2">
                {course.metadata.prerequisites.map((pre: string, index: number) => (
                  <div key={`pre-${index}`} className="flex items-start gap-3 py-1">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{pre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Adjust fallback condition based on detailedOverview */}
        {(detailedOverview === "No overview details available." || !detailedOverview) && !course.creatorSocials?.length && !course.metadata?.objectives?.length && !course.metadata?.prerequisites?.length && (
          <p className="text-muted-foreground text-center py-4">No overview details available for this course.</p>
        )}
      </div>
    );
  }

  if (tab === "content") {
    let sectionCounter = 0;
    return (
      <div className="space-y-4">
        {course.courseItems?.map((item: any, index: number) => {
          if (item.type === 'section') {
            sectionCounter++;
            const section = item;
            const sectionIndex = sectionCounter - 1;
            return (
              <Collapsible key={`section-${index}`} className="border rounded-lg overflow-hidden" defaultOpen={sectionIndex === 0}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-3 text-left">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{sectionCounter}</div>
                    <div>
                      <h3 className="font-medium">{section.title || `Section ${sectionCounter}`}</h3>
                      {section.description && <p className="text-sm text-muted-foreground mt-1">{section.description}</p>}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 py-2 space-y-0">
                    {section.lessons?.map((lesson: any, lessonIndex: number) => (
                      <LessonItem key={`lesson-${index}-${lessonIndex}`} lesson={lesson} sectionItemIndex={index} lessonIndex={lessonIndex} />
                    ))}
                    {(!section.lessons || section.lessons.length === 0) && section.title && (
                      <p className="text-sm text-muted-foreground px-2 py-4 italic">No specific lessons listed for this section.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          } else if (item.type === 'assessment_placeholder') {
            const assessment = item;
            return (
              <button
                type="button"
                key={`assessment-${index}`}
                className="w-full border rounded-lg p-3 bg-muted/20 flex items-center justify-between my-2 text-left hover:bg-muted/40 transition-colors"
                onClick={() => toast.info("Assessment Locked", { description: `Complete previous sections to take the ${assessment.assessmentType}.` })}>
                <div className="flex items-center gap-3">
                  {getAssessmentIcon(assessment.assessmentType)}
                  <span className="font-medium text-sm capitalize">{assessment.assessmentType}</span>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          }
          return null;
        })}
        {course.project && course.project.type === 'assessment_placeholder' && course.project.assessmentType === 'project' && (
          <button
            type="button"
            key={`assessment-final-project`}
            className="w-full border rounded-lg p-3 bg-muted/20 flex items-center justify-between my-2 text-left hover:bg-muted/40 transition-colors"
            onClick={() => toast.info("Assessment Locked", { description: "Complete the course sections to unlock the final project." })}>
            <div className="flex items-center gap-3">{getAssessmentIcon('project')}<span className="font-medium text-sm capitalize">Final Project</span></div>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {(!course.courseItems || course.courseItems.length === 0) && !course.project && (
          <p className="text-muted-foreground text-center py-4">No course content available.</p>
        )}
      </div>
    );
  }

  if (tab === "resources") {
    // Get resources with category field (excluding Social links as they're in the header)
    const allResources = (course.resources || []).filter((r: any) => r.category !== "Social");
    console.log("[TabContent] Rendering 'resources' tab. Resources:", allResources);

    // Separate into two categories: Creator Links and Other Resources (Social removed)
    const creatorLinks = allResources.filter((r: any) => r.category === "Creator Links");
    const otherResources = allResources.filter((r: any) => r.category === "Other Resources");

    const hasAnyResources = creatorLinks.length > 0 || otherResources.length > 0;

    if (!hasAnyResources) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No additional resources available.</p>
        </div>
      );
    }

    const renderResourceSection = (resources: any[], title: string) => {
      if (resources.length === 0) return null;

      return (
        <div>
          <h3 className="text-base font-semibold mb-3 capitalize border-b pb-1.5 text-foreground/90">{title}</h3>
          <div className="space-y-0">
            {resources.map((resource: any, index: number) => {
              const displayType = resource?.type || 'Link';
              const displayTitle = resource?.title || `Resource ${index + 1}`;
              const displayDescription = resource?.description || "No description available.";

              return (
                <React.Fragment key={`resource-${title}-${index}`}>
                  <Collapsible className="overflow-hidden">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3 text-left flex-1 min-w-0 mr-2">
                        {getResourceIcon(resource)}
                        <span className="font-medium text-sm truncate">{displayTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">{displayType}</Badge>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-1 text-sm text-muted-foreground space-y-2">
                        <p>{displayDescription}</p>
                        {resource.url && (
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline resource-link-icon">
                            Visit Link <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {index < resources.length - 1 && <Separator className="my-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {renderResourceSection(creatorLinks, "Creator Links")}
        {renderResourceSection(otherResources, "Other Resources")}
      </div>
    );
  }
  return null;
}

// --- Main CoursePanel Component ---
export function CoursePanel({ className }: { className?: string }) {
  const {
    courseData: contextCourseData, videoData
  } = useAnalysis();
  const courseData = normalizeCourseData(contextCourseData, videoData);
  const [activeTab, setActiveTab] = useState("overview");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (courseData) {
      console.log("[CoursePanel] Course data available:", {
        hasVideoId: !!courseData.videoId,
        title: courseData.title,
        keys: Object.keys(courseData)
      });

      // Ensure we have a valid courseData object with required fields
      const courseDataAny = courseData as any;
      if (!courseDataAny.courseItems || !Array.isArray(courseDataAny.courseItems) || courseDataAny.courseItems.length === 0) {
        console.warn("[CoursePanel] Course data missing courseItems array or empty array");
        // Add a default section if courseItems is missing or empty
        courseDataAny.courseItems = [
          {
            type: 'section',
            title: 'Introduction',
            description: 'Introduction to the course',
            lessons: [
              {
                title: 'Getting Started',
                description: 'Learn the basics of the course',
                duration: '10 minutes',
                keyPoints: ['Introduction to key concepts']
              }
            ]
          }
        ];
      }
    } else {
      console.log("[CoursePanel] No courseData available");
    }
  }, [courseData]);

  const handleScroll = () => { if (scrollContainerRef.current) { setShowScrollTop(scrollContainerRef.current.scrollTop > 300) } }; // Ensure 300 has no leading zero
  const scrollToTop = () => { if (scrollContainerRef.current) { scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' }) } }; // Ensure 0 has no leading zero
  useEffect(() => { const currentRef = scrollContainerRef.current; if (currentRef) { currentRef.addEventListener('scroll', handleScroll); return () => currentRef.removeEventListener('scroll', handleScroll); } }, []);

  // Create a normalized version of the course data with default values
  // Add duration_seconds if available from videoData
  // Parse duration from videoData if it's in ISO 8601 format (PT1H2M10S)
  let duration_seconds = 0;
  if (videoData && videoData.type === 'video' && videoData.duration) {
    // Try to parse the duration string (ISO 8601 format)
    const match = videoData.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const [, hours, minutes, seconds] = match;
      duration_seconds =
        (parseInt(hours || '0') * 3600) +
        (parseInt(minutes || '0') * 60) +
        parseInt(seconds || '0');
    }
  }

  const normalizedCourseData = {
    ...courseData,
    title: courseData.title || "Generated Course",
    description: courseData.description || "No description available",
    videoId: courseData.videoId || "",
    image: courseData.image || "/placeholders/course-thumbnail.jpg",
    duration_seconds: duration_seconds
  };

  const socialGroups = useMemo(() => {
    const resources = (normalizedCourseData.metadata?.resources || []).filter(
      (resource: any) => resource?.category === "Social" && resource?.url
    );

    const orderedGroups: Array<[string, any[]]> = [];
    const groupMap = new Map<string, any[]>();

    resources.forEach((resource: any) => {
      const platform = detectSocialPlatform(resource.title, resource.url);
      if (groupMap.has(platform)) {
        groupMap.get(platform)!.push(resource);
      } else {
        groupMap.set(platform, [resource]);
        orderedGroups.push([platform, groupMap.get(platform)!]);
      }
    });

    return orderedGroups;
  }, [normalizedCourseData.metadata?.resources]);

  // Ensure courseItems exists and is an array
  if (!normalizedCourseData.courseItems || !Array.isArray(normalizedCourseData.courseItems)) {
    console.warn("[CoursePanel] Course data missing courseItems array, adding default");
    normalizedCourseData.courseItems = [
      {
        type: 'section',
        title: 'Introduction',
        description: 'Introduction to the course',
        lessons: [
          {
            title: 'Getting Started',
            description: 'Learn the basics of the course',
            duration: '10 minutes',
            keyPoints: ['Introduction to key concepts']
          }
        ]
      }
    ];
  }

  // If we have course data but missing videoId, try to fix it
  if (!normalizedCourseData.videoId && videoData?.id) {
    console.log("[CoursePanel] Adding missing videoId to course data");
    normalizedCourseData.videoId = videoData.id;
  }

  // Log the normalized course data for debugging
  console.log("[CoursePanel] Normalized course data:", {
    title: normalizedCourseData.title,
    videoId: normalizedCourseData.videoId,
    hasMetadata: !!normalizedCourseData.metadata,
    hasCourseItems: Array.isArray(normalizedCourseData.courseItems) && normalizedCourseData.courseItems.length > 0
  });

  // Use YouTube thumbnail URL directly if available
  // If we have a videoId, always use the YouTube thumbnail directly
  const thumbnailUrl = normalizedCourseData.videoId
    ? `https://i.ytimg.com/vi/${normalizedCourseData.videoId}/maxresdefault.jpg`
    : (videoData?.thumbnail || normalizedCourseData.image || "/placeholders/course-thumbnail.jpg");

  // Log the current state before rendering
  console.log("[CoursePanel] Rendering with state:", {
    hasCourseData: !!courseData,
    hasVideoId: courseData?.videoId ? true : false
  });

  // We should not update state during render phase
  // State updates are handled in the useEffect hook above

  // We should always show the course content in this component
  // The parent component (client.tsx) handles the conditional rendering
  // This component should only be rendered when courseData is available

  // Log the course data for debugging
  console.log("[CoursePanel] Rendering with courseData:", courseData ? {
    hasVideoId: !!courseData.videoId,
    title: courseData.title,
    courseDataType: typeof courseData,
    courseItemsCount: Array.isArray(courseData.courseItems) ? courseData.courseItems.length : 'Not an array'
  } : "No course data");

  // If we don't have valid course data, show a debug message
  if (!courseData) {
    console.error("[CoursePanel] Missing course data entirely");
    return (
      <div className={cn("bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative", className)}>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="max-w-md">
            <p className="text-muted-foreground mb-2">Course data is missing entirely.</p>
            <pre className="mt-2 text-xs text-left bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify({
                hasCourseData: !!courseData
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative", className)}>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin" onScroll={handleScroll}>
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="aspect-video relative overflow-hidden rounded-lg border">
                <Image src={thumbnailUrl} alt={normalizedCourseData.title} fill style={{ objectFit: "cover" }} priority
                  onError={(e) => {
                    console.error("Thumbnail Load Error:", e);
                    // Try YouTube thumbnail with different quality if available
                    if (normalizedCourseData.videoId) {
                      // Try hqdefault which is more reliable than maxresdefault
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${normalizedCourseData.videoId}/hqdefault.jpg`;
                    } else {
                      // If no videoId, use a data URI for a simple colored rectangle
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22720%22%20viewBox%3D%220%200%201280%20720%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231e293b%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2248%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3ECourse%20Thumbnail%3C%2Ftext%3E%3C%2Fsvg%3E';
                    }
                  }}
                />
              </div>
              <CourseSummary course={normalizedCourseData} />
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <div className="sticky top-0 z-10 bg-background border-b"><div className="flex items-center justify-between pr-2">
              <TabsList className="bg-transparent h-10 p-0">
                <TabsTrigger value="overview" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Overview</TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Content</TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Resources</TabsTrigger>
              </TabsList>
            </div></div>
            <TabsContent value="overview" className="px-4 py-4 mt-0 border-none"><TabContent tab="overview" course={normalizedCourseData} /></TabsContent>
            <TabsContent value="content" className="px-4 py-4 mt-0 border-none"><TabContent tab="content" course={normalizedCourseData} /></TabsContent>
            <TabsContent value="resources" className="px-4 py-4 mt-0 border-none"><TabContent tab="resources" course={normalizedCourseData} /></TabsContent>
          </Tabs>
        </div>
        {showScrollTop && (<Button variant="secondary" size="icon" onClick={scrollToTop} className="absolute bottom-4 right-4 z-20"><ArrowUp className="h-4 w-4" /></Button>)}
      </div>
    </div>
  );
}