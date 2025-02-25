import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Send,
  Star,
  Upload,
  X,
  Rocket,
  PencilRuler
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Project } from "../types"
import { cn } from "@/lib/utils"

interface ProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDialog({
  project,
  open,
  onOpenChange
}: ProjectDialogProps) {
  const [submissionTab, setSubmissionTab] = useState<string>("file")
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDescription, setLinkDescription] = useState("")

  if (!project) return null

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && 
    project.status !== "Submitted" && project.status !== "Graded"
  
  // Format dates for display
  const formattedDueDate = project.dueDate 
    ? format(new Date(project.dueDate), "MMMM d, yyyy 'at' h:mm a")
    : null
  
  const formattedSubmissionDate = project.submissionDate
    ? format(new Date(project.submissionDate), "MMMM d, yyyy 'at' h:mm a")
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle project submission logic
    console.log("Project submitted")
    onOpenChange(false)
  }

  // Content based on project status
  const renderContent = () => {
    switch (project.status) {
      case "Not Started":
      case "In Progress":
        return (
          <div className="space-y-6">
            {/* Project description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Project Description</h3>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                {project.description}
              </div>
            </div>
            
            {/* Deadline information */}
            {formattedDueDate && (
              <div className={cn(
                "flex items-center gap-2 text-sm rounded-md p-3",
                isOverdue 
                  ? "bg-red-500/10 text-red-500" 
                  : "bg-blue-500/10 text-blue-500"
              )}>
                {isOverdue ? (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                )}
                <span>
                  {isOverdue 
                    ? `This project was due on ${formattedDueDate}` 
                    : `This project is due on ${formattedDueDate}`}
                </span>
              </div>
            )}
            
            {/* Submission form */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Submit Your Project</h3>

              {/* Submission type tabs */}
              {project.submissionType === "both" && (
                <Tabs 
                  defaultValue="file" 
                  value={submissionTab} 
                  onValueChange={setSubmissionTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file" className="text-sm">File Upload</TabsTrigger>
                    <TabsTrigger value="link" className="text-sm">Link Submission</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              <form onSubmit={handleSubmit}>
                {/* File upload section */}
                {(project.submissionType === "file" || 
                  (project.submissionType === "both" && submissionTab === "file")) && (
                  <div className="space-y-4 mb-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="project-file">Upload Project Files</Label>
                      <div className="border border-dashed border-border rounded-md p-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ZIP, PDF, DOC, or other project files (max. 50MB)
                        </p>
                        <Input 
                          id="project-file" 
                          type="file" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Link submission section */}
                {(project.submissionType === "link" || 
                  (project.submissionType === "both" && submissionTab === "link")) && (
                  <div className="space-y-4 mb-6">
                    <div className="grid w-full gap-2">
                      <Label htmlFor="link-title">Link Title</Label>
                      <Input
                        id="link-title"
                        placeholder="e.g., GitHub Repository"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full gap-2">
                      <Label htmlFor="link-url">Link URL</Label>
                      <div className="flex items-center gap-2 relative">
                        <LinkIcon className="h-4 w-4 absolute left-3 text-muted-foreground" />
                        <Input
                          id="link-url"
                          placeholder="https://github.com/yourusername/project"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="grid w-full gap-2">
                      <Label htmlFor="link-description">Description (Optional)</Label>
                      <Textarea
                        id="link-description"
                        placeholder="Brief description of what this link contains"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button type="submit" className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Project
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      
      case "Submitted":
        return (
          <div className="space-y-6">
            {/* Project description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Project Description</h3>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                {project.description}
              </div>
            </div>
            
            {/* Submission information */}
            <div className="bg-blue-500/10 text-blue-500 rounded-md p-3 flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {formattedSubmissionDate 
                  ? `Submitted on ${formattedSubmissionDate}` 
                  : "Project submitted successfully"}
              </span>
            </div>
            
            {/* Submission details */}
            <div>
              <h3 className="text-sm font-medium mb-2">Your Submission</h3>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>project-submission.zip</span>
                    <Badge variant="outline" className="ml-auto">File</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span>GitHub Repository</span>
                    <Badge variant="outline" className="ml-auto">Link</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-500/10 text-amber-500 rounded-md p-3 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Waiting for feedback from instructors</span>
            </div>
          </div>
        )
      
      case "Graded":
        return (
          <div className="space-y-6">
            {/* Project description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Project Description</h3>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                {project.description}
              </div>
            </div>
            
            {/* Grade information */}
            <div className="bg-green-500/10 text-green-500 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">
                  {project.feedback?.grade}% - {' '}
                  {project.feedback?.grade && project.feedback.grade >= 90 ? "Excellent" :
                   project.feedback?.grade && project.feedback.grade >= 80 ? "Great" :
                   project.feedback?.grade && project.feedback.grade >= 70 ? "Good" :
                   project.feedback?.grade && project.feedback.grade >= 60 ? "Satisfactory" : "Needs Improvement"}
                </div>
                <div className="text-xs text-green-600">
                  Graded on {project.feedback?.createdAt ? format(new Date(project.feedback.createdAt), "MMMM d, yyyy") : ""}
                </div>
              </div>
            </div>
            
            {/* Feedback */}
            <div>
              <h3 className="text-sm font-medium mb-2">Instructor Feedback</h3>
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                {project.feedback?.content || "No detailed feedback provided."}
              </div>
            </div>
            
            {/* Follow-up projects options */}
            <div className="pt-4 border-t flex flex-wrap gap-3">
              <Button className="gap-2 flex-1 min-w-[160px]">
                <Rocket className="h-4 w-4" />
                <span>Similar Project</span>
              </Button>
              <Button variant="outline" className="gap-2 flex-1 min-w-[160px]">
                <PencilRuler className="h-4 w-4" />
                <span>Harder Project</span>
              </Button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="py-6 text-center text-muted-foreground">
            Project information not available
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{project.title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Project metadata */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="secondary" className="gap-1">
            <GraduationCap className="h-3 w-3" />
            {project.courses[0]?.title || "Unknown Course"}
          </Badge>
          <Badge variant="outline" className={cn(
            project.difficulty === "Beginner" && "border-green-500/30 text-green-500",
            project.difficulty === "Intermediate" && "border-blue-500/30 text-blue-500",
            project.difficulty === "Advanced" && "border-purple-500/30 text-purple-500",
          )}>
            {project.difficulty}
          </Badge>
          <Badge variant="outline" className={cn(
            project.status === "Not Started" && "border-muted-foreground/30 text-muted-foreground",
            project.status === "In Progress" && "border-blue-500/30 text-blue-500",
            project.status === "Submitted" && "border-amber-500/30 text-amber-500",
            project.status === "Graded" && "border-green-500/30 text-green-500",
          )}>
            {project.status}
          </Badge>
        </div>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
