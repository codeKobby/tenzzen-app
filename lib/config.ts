/**
 * Load and validate environment variables
 */
const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing ${key} environment variable`)
  }
  return value
}

export const config = {
  youtube: {
    apiKey: getEnvVar('YOUTUBE_API_KEY'),
    apiUrl: 'https://www.googleapis.com/youtube/v3'
  },
  convex: {
    url: getEnvVar('NEXT_PUBLIC_CONVEX_URL')
  }
} as const
