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
      learningAreas: JSON.parse(formData.get('learningAreas') as string || '[]'),
      skillLevels: JSON.parse(formData.get('skillLevels') as string || '{}'),
      referralSource: formData.get('referralSource') as string || undefined
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
