export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean
      displayName?: string
      learningAreas?: string[]
      learningGoal?: string
      currentSkillLevel?: string
      learningPreferences?: string[]
      timeCommitment?: string
      referralSource?: string
    }
  }
}
