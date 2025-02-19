import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ArrowRight, Check, YoutubeIcon, BookOpen, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { CourseGenerateButton } from "@/components/course-generate-button";

const features = [
  {
    icon: YoutubeIcon,
    title: "AI-Powered Course Generation",
    description: "Our advanced AI technology analyzes video content, extracts key concepts, and creates comprehensive course structures. Perfect for educational content, tutorials, and lectures.",
    preview: "Course Generation Interface"
  },
  {
    icon: BookOpen,
    title: "Interactive Learning Path",
    description: "Customized learning journeys with adaptive quizzes, detailed notes, and smart progress tracking. Our system adjusts to your learning style and pace.",
    preview: "Learning Path View"
  },
  {
    icon: Brain,
    title: "Smart Content Organization",
    description: "Advanced algorithms automatically structure content into logical chapters, create detailed summaries, and highlight key concepts for better retention.",
    preview: "Content Organization System"
  },
  {
    icon: Target,
    title: "Learn at Your Pace",
    description: "Flexible learning schedule with bookmarking, progress tracking, and personalized recommendations. Study when and how it works best for you.",
    preview: "Progress Dashboard"
  },
];

const benefits = [
  {
    title: "Structured learning paths",
    description: "Carefully organized content progression ensuring optimal knowledge retention"
  },
  {
    title: "Interactive quizzes",
    description: "AI-generated assessments to test understanding and reinforce learning"
  },
  {
    title: "AI-generated notes",
    description: "Comprehensive summaries and key points extracted from video content"
  },
  {
    title: "Progress tracking",
    description: "Detailed analytics and insights into your learning journey"
  },
  {
    title: "Custom study plans",
    description: "Personalized schedules based on your goals and availability"
  },
  {
    title: "Resource recommendations",
    description: "Curated additional materials to enhance your understanding"
  },
];

const steps = [
  {
    number: "01",
    title: "Paste YouTube URL",
    description: "Simply copy and paste the URL of any educational YouTube video you want to learn from."
  },
  {
    number: "02",
    title: "AI Analysis",
    description: "Our advanced AI analyzes the content, extracts key concepts, and structures the material."
  },
  {
    number: "03",
    title: "Course Generation",
    description: "Get an instantly organized course with chapters, quizzes, and study materials."
  },
  {
    number: "04",
    title: "Start Learning",
    description: "Begin your structured learning journey with progress tracking and assessments."
  },
];

export default function HomePage() {
  return (
    <div className="pb-26">
      <Header />
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-28 pb-32">
        {/* Background patterns */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/10" />
          <div className="absolute top-0 left-0 right-0 h-[800px] bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(var(--primary-rgb),0.15),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--primary-rgb),0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--primary-rgb),0.07)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,black_20%,transparent_70%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="container relative mx-auto">
          <div className="flex flex-col gap-16 items-center">
            {/* Content */}
            <div className="relative space-y-10 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/20 shadow-sm">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-foreground">AI-Powered Learning Platform</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight [text-wrap:balance]">
                    Transform Videos into
                    <span className="relative whitespace-nowrap">
                      <span className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/30 to-primary/0 blur-2xl" />
                      <span className="relative text-foreground"> Engaging Courses</span>
                    </span>
                    <span className="block text-2xl sm:text-3xl lg:text-4xl mt-6 text-muted-foreground font-normal">
                      With the Power of AI
                    </span>
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Turn any YouTube video into an interactive learning experience with AI-generated quizzes, notes, and personalized study plans.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CourseGenerateButton />
                <Button size="lg" variant="outline" className="text-lg h-14" asChild>
                  <Link href="/signup">Start Learning Free</Link>
                </Button>
              </div>

              {/* Benefits Pills */}
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
                {benefits.slice(0, 3).map((benefit) => (
                  <div
                    key={benefit.title}
                    className="bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-primary/10 shadow-sm"
                  >
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{benefit.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Preview */}
            <div className="relative max-w-5xl w-full animate-in fade-in zoom-in-50 duration-1000 fill-mode-both">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-primary/5 to-background rounded-2xl blur-2xl opacity-50 transition-opacity duration-500 hover:opacity-75" />
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <PlaceholderImage title="Platform Demo" />
              </div>
              {/* Floating badges */}
              <div className="absolute -bottom-8 -left-8 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-4 border animate-in fade-in slide-in-from-left-4 duration-1000 fill-mode-both delay-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">AI-Powered</div>
                    <div className="text-muted-foreground">Smart Learning</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-4 border animate-in fade-in slide-in-from-right-4 duration-1000 fill-mode-both delay-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Personalized</div>
                    <div className="text-muted-foreground">Study Plans</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-[85%] mx-auto max-w-6xl py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground">
            Transform any educational video into a structured course in four simple steps
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="text-4xl font-bold text-primary/20 mb-4">{step.number}</div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-background to-background" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--primary-rgb),0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--primary-rgb),0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
        </div>

        <div className="w-[92%] mx-auto max-w-7xl relative">
          <div className="text-center space-y-4 mb-24">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Transform Your Learning Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of online learning with our powerful AI-driven features
            </p>
          </div>

          <div className="flex flex-col gap-48">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`flex flex-col ${features.indexOf(feature) % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-start`}
              >
                {/* Description */}
                <div className={`w-full lg:w-[40%] space-y-8 ${features.indexOf(feature) % 2 === 0 ? '' : 'lg:text-right'}`}>
                  <div>
                    <div className={`inline-flex items-center gap-4 mb-6 ${features.indexOf(feature) % 2 === 0 ? '' : 'lg:flex-row-reverse lg:justify-end'}`}>
                      <div className="relative group/icon">
                        <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary/0 rounded-xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                        <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm transform hover:scale-110 transition-all duration-300">
                          <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className={`group/btn relative overflow-hidden border-primary/20 hover:border-primary/50 ${
                      features.indexOf(feature) % 2 === 0 ? '' : 'lg:ml-auto'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </Button>
                </div>

                {/* Screenshot */}
                <div className="relative group w-full lg:w-[60%]">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-card to-card/50 rounded-2xl p-2 shadow-2xl">
                    <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 via-background to-background" />
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden backdrop-blur-sm transform group-hover:scale-[1.02] transition-transform duration-500">
                      <PlaceholderImage title={feature.preview} />
                    </div>
                  </div>

                  {/* Floating Badge */}
                  <div className={`absolute -bottom-6 ${features.indexOf(feature) % 2 === 0 ? 'right-10' : 'left-10'} bg-card shadow-xl rounded-xl p-4 border transform group-hover:translate-y-1 transition-transform duration-500`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">AI-Powered</div>
                        <div className="text-muted-foreground">Feature</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
