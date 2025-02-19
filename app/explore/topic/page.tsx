import { TopicGenerationForm } from "@/components/topic-generation-form"

export default function TopicExplorePage() {
  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Generate Course from Topic</h1>
        <p className="text-muted-foreground">
          Create a personalized learning path by describing your topic and goals
        </p>
      </div>
      <TopicGenerationForm />
    </div>
  )
}
