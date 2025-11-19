"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface SeekConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetLessonTitle: string
  direction?: 'forward' | 'backward'
  onConfirm: () => void
  onCancel: () => void
}

export function SeekConfirmationModal({
  open,
  onOpenChange,
  targetLessonTitle,
  direction = 'forward',
  onConfirm,
  onCancel
}: SeekConfirmationModalProps) {
  const handleCancel = () => {
    console.log('[SeekConfirmationModal] Cancel clicked')
    onCancel()
  }

  const handleConfirm = () => {
    console.log('[SeekConfirmationModal] Confirm clicked')
    onConfirm()
  }

  const isForward = direction === 'forward'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isForward ? 'Skip to Next Lesson?' : 'Go Back to Previous Lesson?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isForward
              ? `You're trying to seek beyond the current lesson. Would you like to skip to "${targetLessonTitle}"?`
              : `You're trying to seek before the current lesson. Would you like to go back to "${targetLessonTitle}"?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Stay Here</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {isForward ? 'Skip Ahead' : 'Go Back'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
