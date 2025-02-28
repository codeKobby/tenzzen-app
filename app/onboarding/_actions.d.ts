interface OnboardingResponse {
  message?: string;
  error?: string;
}

declare function completeOnboarding(formData: FormData): Promise<OnboardingResponse>;
