import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wand2, X, ListPlus, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateProjectDialog({ open, onOpenChange }: GenerateProjectDialogProps) {
  const [generateMode, setGenerateMode] = useState<"ai" | "custom">("ai")
  const [difficulty, setDifficulty] = useState<string>("Intermediate")
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    setLoading(true)
    
    // Simulate API call to generate project
    setTimeout(() => {
      setLoading(false)
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[550px] overflow-hidden"
        style={{
          top: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
          left: '50%',
          margin: '0',
          maxHeight: '85vh'
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Generate New Project</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-transparent" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="scrollbar-hide overflow-y-auto" style={{ maxHeight: 'calc(85vh - 8rem)' }}>
          <RadioGroup
            defaultValue="ai"
            value={generateMode}
            onValueChange={(value) => setGenerateMode(value as "ai" | "custom")}
            className="grid grid-cols-2 gap-4 pt-2"
          >
            <div>
              <RadioGroupItem
                value="ai"
                id="ai"
                className="peer sr-only"
              />
              <Label
                htmlFor="ai"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                  "cursor-pointer",
                )}
              >
                <Brain className="h-6 w-6 mb-2" />
                <div className="text-center">
                  <div className="font-medium">AI Generated</div>
                  <div className="text-xs text-muted-foreground">
                    Smart project based on your skills & progress
                  </div>
                </div>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem
                value="custom"
                id="custom"
                className="peer sr-only"
              />
              <Label
                htmlFor="custom"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                  "cursor-pointer",
                )}
              >
                <ListPlus className="h-6 w-6 mb-2" />
                <div className="text-center">
                  <div className="font-medium">Custom Project</div>
                  <div className="text-xs text-muted-foreground">
                    Create your own project from scratch
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-4 pt-4">
            {generateMode === "ai" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Courses</SelectItem>
                      <SelectItem value="101">Full-Stack Web Development</SelectItem>
                      <SelectItem value="201">Advanced Machine Learning</SelectItem>
                      <SelectItem value="301">UI/UX Design Fundamentals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <div className="flex flex-col space-y-1.5">
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant={difficulty === "Beginner" ? "default" : "outline"}
                        size="sm" 
                        onClick={() => setDifficulty("Beginner")}
                        className={cn(
                          difficulty === "Beginner" && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        Beginner
                      </Button>
                      <Button 
                        variant={difficulty === "Intermediate" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setDifficulty("Intermediate")}
                        className={cn(
                          difficulty === "Intermediate" && "bg-blue-500 hover:bg-blue-600"
                        )}
                      >
                        Intermediate
                      </Button>
                      <Button 
                        variant={difficulty === "Advanced" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setDifficulty("Advanced")}
                        className={cn(
                          difficulty === "Advanced" && "bg-purple-500 hover:bg-purple-600"
                        )}
                      >
                        Advanced
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {difficulty === "Beginner" && "Perfect for reinforcing fundamental concepts."}
                      {difficulty === "Intermediate" && "Builds on your existing knowledge with moderate challenges."}
                      {difficulty === "Advanced" && "Pushes your limits with complex, real-world scenarios."}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="focus">Project Focus (Optional)</Label>
                  <Textarea 
                    id="focus" 
                    placeholder="E.g., 'I want to practice building APIs' or 'I'm interested in data visualization'"
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add specific skills you'd like to practice or concepts you want to explore
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input id="title" placeholder="Enter a title for your project" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your project's goals and requirements"
                    className="resize-none"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Associated Course</Label>
                    <Select defaultValue="101">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="101">Full-Stack Web Development</SelectItem>
                        <SelectItem value="201">Advanced Machine Learning</SelectItem>
                        <SelectItem value="301">UI/UX Design Fundamentals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="days">Deadline (in days)</Label>
                    <Input type="number" id="days" min="1" defaultValue="7" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={difficulty === "Beginner" ? "default" : "outline"}
                      size="sm" 
                      onClick={() => setDifficulty("Beginner")}
                      className={cn(
                        difficulty === "Beginner" && "bg-green-500 hover:bg-green-600"
                      )}
                    >
                      Beginner
                    </Button>
                    <Button 
                      variant={difficulty === "Intermediate" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setDifficulty("Intermediate")}
                      className={cn(
                        difficulty === "Intermediate" && "bg-blue-500 hover:bg-blue-600"
                      )}
                    >
                      Intermediate
                    </Button>
                    <Button 
                      variant={difficulty === "Advanced" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setDifficulty("Advanced")}
                      className={cn(
                        difficulty === "Advanced" && "bg-purple-500 hover:bg-purple-600"
                      )}
                    >
                      Advanced
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="submission-type">Submission Type</Label>
                  <Select defaultValue="both">
                    <SelectTrigger>
                      <SelectValue placeholder="Select submission type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="link">Link Submission</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Project Category</Label>
                  <Select defaultValue="programming">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="architecture">Architecture</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="mobile">Mobile Dev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4 mt-4 border-t">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generate Project</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
