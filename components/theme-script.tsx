"use client"

import Script from "next/script"

export function ThemeScript() {
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {`
        try {
          let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          let theme = localStorage.getItem('theme')
          if (theme === 'dark' || (!theme && isDark)) {
            document.documentElement.classList.add('dark')
          }
          // Always use modern theme
          document.documentElement.classList.add('theme-modern')
        } catch (e) {}
      `}
    </Script>
  )
}