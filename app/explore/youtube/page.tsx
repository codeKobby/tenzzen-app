import { YoutubeContentForm } from "@/components/youtube-content-form"

export default function YoutubeExplorePage() {
  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Generate Course from YouTube</h1>
        <p className="text-muted-foreground">
          Create an interactive course from YouTube videos, playlists, or channel content
        </p>
      </div>
      <YoutubeContentForm />
    </div>
  )
}
