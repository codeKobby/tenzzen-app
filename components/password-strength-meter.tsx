"use client"

import { CheckCircle, XCircle } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
}

const requirements = [
  { regex: /.{8,}/, label: "At least 8 characters" },
  { regex: /[A-Z]/, label: "One uppercase letter" },
  { regex: /[a-z]/, label: "One lowercase letter" },
  { regex: /\d/, label: "One number" },
  { regex: /[@$!%*?&]/, label: "One special character" },
]

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const getStrength = (password: string) => {
    let strength = 0
    requirements.forEach((req) => {
      if (req.regex.test(password)) strength += 1
    })
    return strength
  }

  const strength = getStrength(password)
  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"][strength - 1] || "Too Short"
  const strengthColor = ["red", "orange", "yellow", "green", "blue"][strength - 1] || "gray"

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full bg-${strengthColor}-500 transition-all`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium text-${strengthColor}-600`}>{strengthText}</span>
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            {req.regex.test(password) ? (
              <CheckCircle className="text-green-500 w-4 h-4" />
            ) : (
              <XCircle className="text-red-500 w-4 h-4" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}