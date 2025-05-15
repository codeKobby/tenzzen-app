"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    BellOff,
    BookmarkPlus,
    Download,
    Eye,
    EyeOff,
    Share,
    ShieldAlert,
    Trash
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { NormalizedCourse } from "@/hooks/use-normalized-course"

interface CourseSettingsProps {
    course: NormalizedCourse
}

export function CourseSettings({ course }: CourseSettingsProps) {
    const router = useRouter()
    const { userId } = useAuth()

    // Settings state
    const [autoplay, setAutoplay] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [downloadEnabled, setDownloadEnabled] = useState(false)

    // Dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Handle settings change
    const handleSettingChange = (setting: string, value: boolean) => {
        switch (setting) {
            case "autoplay":
                setAutoplay(value)
                toast.success(`Autoplay ${value ? "enabled" : "disabled"}`)
                break
            case "notifications":
                setNotifications(value)
                toast.success(`Notifications ${value ? "enabled" : "disabled"}`)
                break
            case "download":
                setDownloadEnabled(value)
                toast.success(`Offline access ${value ? "enabled" : "disabled"}`)
                break
        }
    }

    // Handle course delete
    const handleDeleteCourse = async () => {
        if (!userId) {
            toast.error("You must be logged in to delete a course")
            return
        }

        setIsDeleting(true)

        try {
            // Call the API to unenroll from the course
            const response = await fetch('/api/supabase/courses/unenroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ courseId: course.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to unenroll');
            }

            toast.success("Course deleted successfully", {
                description: "The course has been removed from your library",
            })

            // Navigate back to courses page
            router.push("/courses")
        } catch (error) {
            toast.error("Failed to delete course", {
                description: "Please try again later",
            })
            console.error('Error deleting course:', error);
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Course Playback Settings */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Playback Settings</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoplay">Autoplay videos</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically play the next lesson when one finishes
                            </p>
                        </div>
                        <Switch
                            id="autoplay"
                            checked={autoplay}
                            onCheckedChange={(value) => handleSettingChange("autoplay", value)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="notifications">Lesson notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications about new content and updates
                            </p>
                        </div>
                        <Switch
                            id="notifications"
                            checked={notifications}
                            onCheckedChange={(value) => handleSettingChange("notifications", value)}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="download">Enable offline access</Label>
                            <p className="text-sm text-muted-foreground">
                                Download course materials for offline viewing
                            </p>
                        </div>
                        <Switch
                            id="download"
                            checked={downloadEnabled}
                            onCheckedChange={(value) => handleSettingChange("download", value)}
                        />
                    </div>
                </div>
            </div>

            {/* Course Actions */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Course Actions</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        Save to collection
                    </Button>

                    <Button variant="outline" className="justify-start">
                        <Share className="h-4 w-4 mr-2" />
                        Share course
                    </Button>

                    <Button variant="outline" className="justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download materials
                    </Button>

                    <Button variant="outline" className="justify-start">
                        <BellOff className="h-4 w-4 mr-2" />
                        Mute notifications
                    </Button>

                    <Button variant="outline" className="justify-start">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Report an issue
                    </Button>

                    <Button variant="outline" className="justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Hide from library
                    </Button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4 border border-destructive/10 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-center">
                    <ShieldAlert className="h-5 w-5 text-destructive mr-2" />
                    <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                    Actions in this section cannot be undone. Please proceed with caution.
                </p>

                <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => setShowDeleteDialog(true)}
                >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Course
                </Button>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove "{course.title}" from your enrolled courses.
                            Your progress will be lost and you'll need to re-enroll if you want to access it again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteCourse()
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
