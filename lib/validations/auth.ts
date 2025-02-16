import * as z from "zod"

export const emailSchema = z.string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .max(255, "Email is too long")

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters") // bcrypt limit
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  )

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Map Supabase error codes to user-friendly messages
export const getAuthErrorMessage = (error: any) => {
  const code = error?.message || ''
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email address before signing in',
    'User already registered': 'An account with this email already exists',
    'Password is too weak': 'Please choose a stronger password',
    'Email link is invalid or has expired': 'The verification link has expired. Please request a new one',
    'Email rate limit exceeded': 'Too many attempts. Please try again later',
    'Network request failed': 'Connection error. Please check your internet connection',
  }

  return errorMessages[code] || 'Something went wrong. Please try again'
}

// Toast messages for different auth states
export const AUTH_MESSAGES = {
  SIGN_IN_SUCCESS: {
    title: "Welcome back!",
    description: "Successfully signed in to your account.",
  },
  SIGN_UP_SUCCESS: {
    title: "Account created",
    description: "Please check your email to verify your account.",
  },
  PASSWORD_RESET_SENT: {
    title: "Check your email",
    description: "We've sent you a password reset link.",
  },
  PASSWORD_RESET_SUCCESS: {
    title: "Password updated",
    description: "Your password has been successfully changed.",
  },
  VERIFICATION_REQUIRED: {
    title: "Verification required",
    description: "Please verify your email address to continue.",
  },
  EMAIL_VERIFIED: {
    title: "Email verified",
    description: "Your email has been successfully verified.",
  },
}