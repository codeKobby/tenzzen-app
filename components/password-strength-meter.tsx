"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
  isFocused: boolean
}

const requirements = [
  { regex: /.{8,}/, label: "At least 8 characters" },
  { regex: /[A-Z]/, label: "One uppercase letter" },
  { regex: /[a-z]/, label: "One lowercase letter" },
  { regex: /\d/, label: "One number" },
  { regex: /[@$!%*?&]/, label: "One special character" },
]

export function PasswordStrengthMeter({ password, isFocused }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const getStrength = (password: string) => {
      let strength = 0
      requirements.forEach((req) => {
        if (req.regex.test(password)) strength += 1
      })
      return strength
    }

    setStrength(getStrength(password))
  }, [password])

  const strengthLevels = [
    { text: "Too Short", color: "bg-gray-300" },
    { text: "Weak", color: "bg-red-500" },
    { text: "Fair", color: "bg-orange-500" },
    { text: "Good", color: "bg-yellow-500" },
    { text: "Strong", color: "bg-green-500" },
    { text: "Very Strong", color: "bg-blue-500" }
  ]
  
  const currentStrength = strength === 0 ? 0 : strength
  const strengthInfo = strengthLevels[currentStrength] || strengthLevels[0]

  return (
    <div className="space-y-2">
      {(isFocused || (password.length > 0 && strength < requirements.length)) && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color}`}
                style={{ width: `${(currentStrength / 5) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{strengthInfo.text}</span>
          </div>
          <ul className="space-y-1">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-1.5 text-xs">
                {req.regex.test(password) ? (
                  <CheckCircle className="text-green-500 w-3 h-3" />
                ) : (
                  <XCircle className="text-red-500 w-3 h-3" />
                )}
                <span className="text-muted-foreground">{req.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
