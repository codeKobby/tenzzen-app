"use client"

import { useState, useEffect } from 'react'

export const COOKIE_CONSENT_KEY = 'cookie-consent'

type ConsentStatus = 'accepted' | 'declined' | null

export function useCookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get initial consent status from localStorage
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus
    setConsentStatus(storedConsent)
    setIsLoaded(true)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setConsentStatus('accepted')
  }

  const declineCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
    setConsentStatus('declined')
    
    // When cookies are declined:
    // 1. Clear any existing non-essential cookies
    // 2. You might want to disable analytics or other tracking
    const cookies = document.cookie.split(';')
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=').map(c => c.trim())
      // Preserve only essential cookies (like auth)
      if (!isEssentialCookie(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    })
  }

  const isEssentialCookie = (name: string) => {
    // List of essential cookies that should be preserved
    const essentialCookies = [
      'sb-access-token',  // Supabase auth
      'sb-refresh-token', // Supabase auth
      '__Host-next-auth.csrf-token', // Next.js auth
      '__Secure-next-auth.session-token', // Next.js auth
    ]
    return essentialCookies.includes(name)
  }

  return {
    consentStatus,
    isLoaded,
    acceptCookies,
    declineCookies,
    hasConsented: consentStatus === 'accepted',
  }
}
