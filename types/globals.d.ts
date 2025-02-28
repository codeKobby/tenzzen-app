export {}

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete: boolean
      // Learning Areas and Skills
      learningAreas: string[]  // Both predefined areas and custom topics
      skillLevels: Record<string, SkillLevel>  // Skill level per learning area
      // Optional Info
      referralSource?: string
    }
  }
}
