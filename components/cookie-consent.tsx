  "use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { useCookieConsent } from '@/hooks/use-cookie-consent'

export function CookieConsent() {
  const { consentStatus, isLoaded, acceptCookies, declineCookies } = useCookieConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true, // Always true and disabled
    functional: true,
    analytics: true,
  })

  // Don't show until we've checked localStorage
  if (!isLoaded || consentStatus) return null

  const handleCustomize = () => {
    setShowDetails(!showDetails)
  }

  const handleSavePreferences = () => {
    if (preferences.functional || preferences.analytics) {
      acceptCookies()
    } else {
      declineCookies()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="container mx-auto max-w-7xl">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold">Cookie Settings</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience and provide essential functionality. 
                  Read our{" "}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </Link>
                  {" "}and{" "}
                  <Link href="/cookie-policy" className="underline underline-offset-4 hover:text-primary">
                    Cookie Policy
                  </Link>
                  {" "}to learn more.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCustomize}>
                  {showDetails ? 'Hide Details' : 'Customize'}
                </Button>
                <Button variant="outline" onClick={declineCookies}>
                  Decline All
                </Button>
                <Button onClick={acceptCookies}>
                  Accept All
                </Button>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="essential"
                      checked={true}
                      disabled
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="essential"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Essential Cookies
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Required for core functionality like authentication and security. These cannot be disabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="functional"
                      checked={preferences.functional}
      onCheckedChange={(checked: boolean | 'indeterminate') => 
        setPreferences(prev => ({ ...prev, functional: checked === true }))
      }
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="functional"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Functional Cookies
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Enable personalized features and remember your preferences.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="analytics"
                      checked={preferences.analytics}
      onCheckedChange={(checked: boolean | 'indeterminate') => 
        setPreferences(prev => ({ ...prev, analytics: checked === true }))
      }
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="analytics"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Analytics Cookies
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Help us improve by collecting anonymous usage data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
