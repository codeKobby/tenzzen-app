"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  X, Play, Bookmark, GraduationCap, Clock, BookOpen, FileText, TestTube2,
  XCircle, Tag, ChevronDown, Lock, FileQuestion, Code, Briefcase, CheckCircle2,
  ArrowUp, Loader2, FileCode, Link, Book, Newspaper, Youtube, ExternalLink, BrainCircuit, FileQuestionIcon, ClipboardCheck, Trophy
} from "lucide-react";

// --- Helper to normalize AI output ---
function normalizeCourseData(raw: any) {
  if (!raw) {
    return {
      title: "Loading Course...",
      description: "",
      image: "/placeholder-thumbnail.jpg", // Ensure correct path and closing quote
      videoId: "",
      metadata: {
        category: "General", tags: [], difficulty: "N/A", prerequisites: [],
        objectives: [], overviewText: "", resources: [], duration: ""
      },
      sections: [], project: null
    };
  }
  const metadata = {
    category: raw.category || raw.metadata?.category || "General",
    tags: raw.tags || raw.metadata?.tags || [],
    difficulty: raw.difficulty || raw.metadata?.difficulty || "N/A",
    prerequisites: raw.prerequisites || raw.metadata?.prerequisites || [],
    objectives: raw.objectives || raw.metadata?.objectives || [],
    overviewText: raw.overviewText || raw.metadata?.overviewText || raw.description || "",
    resources: raw.resources || raw.metadata?.sources || [], // Use metadata.resources
    duration: raw.duration || raw.metadata?.duration || "Variable duration"
  };
  const sections = raw.sections || [];
  let project = raw.project || null;
  if (!project && Array.isArray(sections)) {
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.assessment === 'project') {
      project = { assessment: 'project' };
    }
  }
  return {
    title: raw.title || "Generated Course",
    description: raw.description || "",
    image: raw.image || raw.metadata?.thumbnail || "/placeholder-thumbnail.jpg",
    videoId: raw.videoId || "",
    metadata, sections, project
  };
}

// --- Action Buttons ---
function ActionButtons({ className }: { className?: string }) {
  const isSmall = className?.includes("sm");
  return (
    <div className={cn("flex gap-2", className)}>
      <Button className="gap-1.5" size={isSmall ? "sm" : "default"}> <GraduationCap className="h-4 w-4" /> {!isSmall && "Enroll Now"} </Button>
      <Button variant="outline" className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" size={isSmall ? "sm" : "default"}> <XCircle className="h-4 w-4" /> {!isSmall && "Cancel"} </Button>
    </div>
  );
}

// --- Updated Course Summary ---
function CourseSummary({ course }: { course: any }) {
  const totalLessons = course.sections?.reduce( (acc: number, section: any) => acc + (section.lessons?.length || 0), 0 ) || 0;
  return (
    <div className="flex flex-col gap-3"> {/* Reduced gap slightly */}
      {/* --- Refined Metadata Styling --- */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"> {/* Allow vertical gap */}
        {/* Category - More prominent */}
        {course.metadata?.category && (
          <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-0.5">
            {course.metadata.category}
          </Badge>
        )}
        {/* Difficulty - Subtle outline */}
        {course.metadata?.difficulty && (
          <Badge variant="outline" className="border-border/70 text-muted-foreground px-2.5 py-0.5">
            {course.metadata.difficulty}
          </Badge>
        )}
      </div>
      {/* Tags - Smaller, distinct color */}
      {course.metadata?.tags && course.metadata.tags.length > 0 && (
         <div className="flex flex-wrap gap-1.5"> {/* Use div for better wrapping */}
           {course.metadata.tags.map((tag: string) => (
             <Badge key={tag} variant="secondary" className="text-xs font-normal bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 px-2 py-0.5">
               {tag} {/* Removed '#' for cleaner look */}
             </Badge>
           ))}
         </div>
      )}
      {/* --- End Refined Metadata Styling --- */}

      {/* About this course */}
      <div>
        <h3 className="font-semibold text-lg mt-1">About this course</h3>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-4">
          {course.description || "No description provided."}
        </p>
      </div>
      {/* Course stats */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
         {course.metadata?.duration && course.metadata.duration !== "Variable duration" && (
           <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>{course.metadata.duration}</span></div>
         )}
        <div className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /><span>{totalLessons} Lesson{totalLessons !== 1 ? 's' : ''}</span></div>
      </div>
      <ActionButtons className="flex-1 mt-3" /> {/* Adjusted margin */}
    </div>
  )
}

// --- Icon Helpers ---
const getResourceIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'documentation': return <FileCode className="h-4 w-4 text-blue-500" />;
    case 'tutorial': return <BrainCircuit className="h-4 w-4 text-green-500" />;
    case 'article': return <Newspaper className="h-4 w-4 text-purple-500" />;
    case 'video': return <Youtube className="h-4 w-4 text-red-500" />;
    case 'code': return <Code className="h-4 w-4 text-amber-500" />;
    case 'blog': return <BookOpen className="h-4 w-4 text-indigo-500" />;
    case 'tool': return <Briefcase className="h-4 w-4 text-pink-500" />;
    case 'book': return <Book className="h-4 w-4 text-gray-500" />;
    default: return <Link className="h-4 w-4 text-gray-500" />;
  }
};
const getAssessmentIcon = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'quiz': case 'test': return <FileQuestionIcon className="h-5 w-5 text-blue-500" />;
    case 'assignment': return <ClipboardCheck className="h-5 w-5 text-green-500" />;
    case 'project': return <Trophy className="h-5 w-5 text-amber-500" />;
    default: return <FileQuestion className="h-5 w-5 text-gray-500" />;
  }
};

// --- Updated Tab Content ---
function TabContent({ tab, course }: { tab: string; course: any }) {
  if (tab === "overview") {
    console.log("[TabContent] Rendering 'overview' tab. Metadata:", course.metadata);
    return (
      <div className="space-y-6 text-sm">
        {course.metadata?.overviewText && (
          <div>
            <h3 className="text-lg font-medium mb-2">Course Overview</h3>
            <p className="text-muted-foreground">{course.metadata.overviewText}</p>
          </div>
        )}
        {course.metadata?.objectives && course.metadata.objectives.length > 0 && (<div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50"><h3 className="text-lg font-medium mb-3">What you'll learn</h3><ul className="space-y-2">
          {course.metadata.objectives.map((objective: string, i: number) => (<li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-500 shrink-0" /><span>{objective}</span></li>))}</ul></div>)}
        {course.metadata?.prerequisites && course.metadata.prerequisites.length > 0 && (<div><h3 className="text-lg font-medium mb-2">Prerequisites</h3><ul className="space-y-1 list-disc pl-5 text-muted-foreground">
          {course.metadata.prerequisites.map((prerequisite: string, i: number) => (<li key={i}>{prerequisite}</li>))}</ul></div>)}
      </div>
    )
  }
  if (tab === "content") {
    console.log("[TabContent] Rendering 'content' tab. Sections data:", course.sections);
    return (
      <div className="space-y-4">
        {course.sections?.map((section: any, sectionIndex: number) => {
          console.log(`[TabContent] Mapping Section ${sectionIndex}:`, section);
          const isProjectSection = section.assessment === 'project';
          return (
            <React.Fragment key={`section-frag-${sectionIndex}`}>
              {!isProjectSection && (
                <Collapsible key={`section-${sectionIndex}`} className="border rounded-lg overflow-hidden" defaultOpen={sectionIndex === 0}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3 text-left"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{sectionIndex + 1}</div><div><h3 className="font-medium">{section.title || `Section ${sectionIndex + 1}`}</h3><p className="text-sm text-muted-foreground">{section.description}</p></div></div><ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent><div className="border-t px-4 py-2 space-y-1">
                    {section.lessons?.map((lesson: any, lessonIndex: number) => {
                      console.log(`[TabContent]   Mapping Lesson ${lessonIndex} in Section ${sectionIndex}:`, lesson);
                      return (
                        <div key={`lesson-${sectionIndex}-${lessonIndex}`} className="flex items-center justify-between py-2 px-2 hover:bg-muted/40 rounded-md transition-colors cursor-pointer group">
                          <div className="flex gap-3 items-center"><div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]">{lessonIndex + 1}</div><span className="text-sm font-medium">{lesson.title}</span></div><Play className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>);
                    })}
                  </div></CollapsibleContent>
                </Collapsible>)}
              {section.assessment && (<div key={`assessment-${sectionIndex}`} className="border rounded-lg p-3 bg-muted/20 flex items-center justify-between my-2">
                <div className="flex items-center gap-3">{getAssessmentIcon(section.assessment)}<span className="font-medium text-sm capitalize">{section.assessment === 'project' ? 'Final Project' : section.assessment}</span></div></div>)}
            </React.Fragment>);
        })}
      </div>
    )
  }
  if (tab === "resources") {
    const resources = course.metadata?.resources || [];
    console.log("[TabContent] Rendering 'resources' tab. Resources data:", resources);
    const groupedResources = resources.reduce((acc: any, resource: any) => { const sourceKey = resource.source || 'supplementary'; if (!acc[sourceKey]) { acc[sourceKey] = []; } acc[sourceKey].push(resource); return acc; }, {});
    const sourceOrder = ['video', 'practice', 'supplementary'];
    return (
      <div className="space-y-6">
        {sourceOrder.map(sourceKey => (groupedResources[sourceKey] && groupedResources[sourceKey].length > 0 && (
          <div key={sourceKey}><h3 className="text-lg font-medium mb-3 capitalize">{sourceKey === 'video' ? 'Mentioned in Video' : sourceKey} Resources</h3><div className="space-y-3">
            {groupedResources[sourceKey].map((resource: any, index: number) => {
              console.log(`[TabContent] Mapping Resource ${index} (Source: ${sourceKey}):`, resource);
              return (
                <Collapsible key={`resource-${sourceKey}-${index}`} className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 text-left">{getResourceIcon(resource.type)}<span className="font-medium text-sm">{resource.title || "Resource"}</span></div><div className="flex items-center gap-2"><Badge variant="outline" className="text-xs capitalize">{resource.type || 'Link'}</Badge><ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" /></div>
                  </CollapsibleTrigger>
                  <CollapsibleContent><div className="border-t p-3 text-sm text-muted-foreground space-y-2"><p>{resource.description || "No description available."}</p><a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline resource-link-icon">Visit Resource <ExternalLink className="h-3.5 w-3.5" /></a></div></CollapsibleContent>
                </Collapsible>);
            })}
          </div></div>)))} {resources.length === 0 && (<p className="text-muted-foreground text-center py-4">No additional resources available.</p>)}
      </div>
    )
  }
  return null
}

// --- Main CoursePanel Component ---
export function CoursePanel({ className }: { className?: string }) {
  const { courseGenerating, progressMessage, generationProgress, courseError, cancelGeneration, courseData: contextCourseData } = useAnalysis();
  const courseData = normalizeCourseData(contextCourseData);
  const [activeTab, setActiveTab] = useState("overview");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (courseData && !courseGenerating) {
      console.log("[CoursePanel] Rendering with courseData:", JSON.stringify(courseData, null, 2));
      console.log("[CoursePanel] Sections (count):", courseData.sections?.length);
      console.log("[CoursePanel] Resources (count from metadata.resources):", courseData.metadata?.resources?.length);
    }
  }, [courseData, courseGenerating]);

  const handleScroll = () => { if (scrollContainerRef.current) { setShowScrollTop(scrollContainerRef.current.scrollTop > 300) } };
  const scrollToTop = () => { if (scrollContainerRef.current) { scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' }) } };

  useEffect(() => { const currentRef = scrollContainerRef.current; if (currentRef) { currentRef.addEventListener('scroll', handleScroll); return () => currentRef.removeEventListener('scroll', handleScroll); } }, []);

  const thumbnailUrl = courseData?.image || "/placeholder-thumbnail.jpg";

  return (
    <div className={cn("bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out relative", className)}>
      {courseGenerating && (<div className="flex flex-col items-center justify-center flex-1 p-4 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4" /><p className="font-medium mb-1">{progressMessage || "Generating Course..."}</p><p className="text-sm text-muted-foreground mb-4">AI is structuring your learning experience.</p><Button variant="outline" size="sm" onClick={cancelGeneration} className="mt-4">Cancel</Button></div>)}
      {!courseGenerating && courseError && (<div className="flex flex-col items-center justify-center flex-1 p-4 text-center"><XCircle className="h-8 w-8 text-destructive mb-4" /><p className="font-medium text-destructive mb-1">Generation Failed</p><p className="text-sm text-muted-foreground mb-4">{courseError}</p></div>)}
      {!courseGenerating && !courseError && courseData && courseData.videoId && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin" onScroll={handleScroll}>
            <div className="p-4 border-b"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="aspect-video relative overflow-hidden rounded-lg border"><Image src={thumbnailUrl} alt={courseData.title} fill style={{ objectFit: "cover" }} priority /></div>
              <CourseSummary course={courseData} />
            </div></div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
              <div className="sticky top-0 z-10 bg-background border-b"><div className="flex items-center justify-between pr-2">
                <TabsList className="bg-transparent h-10 p-0">
                  <TabsTrigger value="overview" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Overview</TabsTrigger>
                  <TabsTrigger value="content" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Content</TabsTrigger>
                  <TabsTrigger value="resources" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Resources</TabsTrigger>
                </TabsList>
              </div></div>
              <TabsContent value="overview" className="px-4 py-4 mt-0 border-none"><TabContent tab="overview" course={courseData} /></TabsContent>
              <TabsContent value="content" className="px-4 py-4 mt-0 border-none"><TabContent tab="content" course={courseData} /></TabsContent>
              <TabsContent value="resources" className="px-4 py-4 mt-0 border-none"><TabContent tab="resources" course={courseData} /></TabsContent>
            </Tabs>
          </div>
          {showScrollTop && (<Button variant="secondary" size="icon" onClick={scrollToTop} className="absolute bottom-4 right-4 z-20"><ArrowUp className="h-4 w-4" /></Button>)}
        </div>)}
    </div>
  );
}
