'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth()
  
  if (!userId) {
    return { error: 'Not authenticated' }
  }

  try {
    // Parse the form data
    const metadata = {
      onboardingComplete: true,
      displayName: formData.get('displayName'),
      learningAreas: JSON.parse(formData.get('learningAreas') as string || '[]'),
      learningGoal: formData.get('learningGoal'),
      currentSkillLevel: formData.get('currentSkillLevel'),
      learningPreferences: JSON.parse(formData.get('learningPreferences') as string || '[]'),
      timeCommitment: formData.get('timeCommitment'),
      referralSource: formData.get('referralSource')
    }

    // Update the user's metadata in Clerk
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: metadata
    })
    
    // Revalidate relevant pages to ensure they get fresh data
    revalidatePath('/dashboard')
    revalidatePath('/profile')
    
    console.log('Onboarding completed successfully')
    
    return { message: 'Onboarding complete' }
  } catch (err) {
    console.error('Error completing onboarding:', err)
    return { error: 'Failed to complete onboarding' }
  }
}
