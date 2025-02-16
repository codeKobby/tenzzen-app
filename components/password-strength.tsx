'use client'

import { Check, X } from 'lucide-react'

interface PasswordRequirement {
  text: string
  validator: (value: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    text: 'At least 8 characters long',
    validator: (value) => value.length >= 8,
  },
  {
    text: 'Contains at least one uppercase letter',
    validator: (value) => /[A-Z]/.test(value),
  },
  {
    text: 'Contains at least one lowercase letter',
    validator: (value) => /[a-z]/.test(value),
  },
  {
    text: 'Contains at least one number',
    validator: (value) => /[0-9]/.test(value),
  },
  {
    text: 'Contains at least one special character',
    validator: (value) => /[^A-Za-z0-9]/.test(value),
  },
]

interface PasswordStrengthProps {
  password: string
  showValidation: boolean
  onValidationChange?: (isValid: boolean) => void
}

export function PasswordStrength({ 
  password, 
  showValidation,
  onValidationChange 
}: PasswordStrengthProps) {
  const validRequirements = requirements.filter((req) => req.validator(password))
  const progress = (validRequirements.length / requirements.length) * 100
  const isAllValid = validRequirements.length === requirements.length

  // Notify parent of validation state changes
  if (onValidationChange) {
    onValidationChange(isAllValid)
  }

  if (!showValidation && !password) {
    return null
  }

  return (
    <div 
      className="space-y-4 animate-in"
      style={{
        opacity: showValidation || password ? 1 : 0,
        transition: 'opacity 150ms ease-in-out',
      }}
    >
      <div className="h-1 w-full bg-secondary overflow-hidden rounded-full">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: progress < 50
              ? 'hsl(var(--destructive))'
              : progress < 100
              ? 'hsl(var(--warning))'
              : 'hsl(var(--success))',
          }}
        />
      </div>

      <div className="grid gap-2 text-sm">
        {requirements.map((requirement, index) => {
          const isValid = requirement.validator(password)
          return (
            <div
              key={index}
              className={`flex items-center gap-2 transition-colors duration-150 ${
                isValid ? 'text-success' : 'text-muted-foreground'
              }`}
            >
              <div className="h-5 w-5 flex items-center justify-center">
                {isValid ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </div>
              <span>{requirement.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
