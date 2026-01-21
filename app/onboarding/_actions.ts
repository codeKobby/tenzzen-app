'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth()
  
  if (!userId) {
    return { error: 'Not authenticated' }
  }

  try {
    const client = await clerkClient()
    const publicMetadata: CustomJwtSessionClaims['metadata'] = {
      onboardingComplete: true,
      role: formData.get('role') as string || undefined,
      referralSource: formData.get('source') as string || undefined,
      learningGoal: formData.get('goal') as string || undefined,
      // Keep compatibility with any existing queries
      learningAreas: JSON.parse(formData.get('learningAreas') as string || '[]'),
    }

    const res = await client.users.updateUser(userId, {
      publicMetadata
    })

    return { message: res.publicMetadata }
  } catch (err) {
    console.error('Error completing onboarding:', err)
    return { error: 'Failed to complete onboarding' }
  }
}
