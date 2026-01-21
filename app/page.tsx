'use client'

import { Suspense } from 'react';
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { HeroDemo } from "@/components/landing/hero-demo";
import { FeatureIllustration } from "@/components/landing/feature-illustration";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Check, YoutubeIcon, BookOpen, Brain, Target, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseGenerateButton } from "@/components/course-generate-button";
import { FeatureCard } from "@/components/ui/feature-card";

export const dynamic = 'force-dynamic';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  preview: string;
}

interface Benefit {
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

const features: Feature[] = [
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

const benefits: Benefit[] = [
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

const steps: Step[] = [
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
      <section className="section-light relative min-h-[85vh] py-20 lg:py-24 flex items-center justify-center">
        <div className="background-grid" />
        <div className="background-gradient" />
        <div className="background-drift" />
        <div className="pattern-noise" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {/* Badge */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/20 shadow-sm">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">AI-Powered Learning Platform</span>
              </div>
            </div>

            {/* Main Grid - Text and Demo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center w-full max-w-6xl mx-auto">
              {/* Left: Text Content */}
              <div className="max-w-lg w-full fade-in-up text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight [text-wrap:balance]">
                  Transform Videos into
                  <span className="relative whitespace-nowrap block mt-3 text-primary">
                    <span className="absolute -z-10 inset-0 bg-gradient-to-r from-primary/30 to-primary/0 blur-2xl" />
                    Engaging Courses
                  </span>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground/80 font-medium">
                  With the Power of AI
                </p>
                <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Turn any YouTube video into an interactive learning experience with AI-generated quizzes, notes, and personalized study plans.
                </p>
              </div>

              {/* Right: Demo Component */}
              <div className="max-w-xl w-full fade-in-up delay-300 mx-auto lg:mx-0">
                <HeroDemo />
              </div>
            </div>

            {/* CTAs - Centered below grid */}
            <div className="w-full max-w-2xl mx-auto text-center space-y-6">
              <div className="flex flex-wrap gap-3 justify-center">
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

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Suspense fallback={<Button size="lg" className="text-base h-12 px-6 shadow-lg shadow-primary/20" disabled>Loading...</Button>}>
                  <CourseGenerateButton size="lg" className="text-base h-12 px-6 shadow-lg shadow-primary/20" />
                </Suspense>
                <SignedIn>
                  <Button size="lg" variant="outline" className="text-base h-12 px-6 hover:bg-primary/5" asChild>
                    <Link href="/courses">Continue Learning</Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button size="lg" variant="outline" className="text-base h-12 px-6 hover:bg-primary/5" asChild>
                    <Link href={"/sign-up" as any}>Start Learning Free</Link>
                  </Button>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-dark">
        <RevealOnScroll>
          <div className="background-grid" />
          <div className="background-gradient" />
          <div className="pattern-grid opacity-30" />

          <div className="w-[85%] mx-auto max-w-6xl py-24">
            <div className="text-center max-w-2xl mx-auto mb-16 fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">
                Transform any educational video into a structured course in four simple steps
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={step.number} className={`relative overflow-hidden transition-colors hover:border-primary/50 fade-in-up delay-${(index + 1) * 100}`}>
                  <CardHeader>
                    <div className="text-4xl font-bold text-primary/20 mb-4">{step.number}</div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Features Section */}
      <section className="section-light py-32">
        <RevealOnScroll>
          <div className="background-grid" />
          <div className="background-drift" />
          <div className="pattern-dots opacity-50" />

          <div className="w-[92%] mx-auto max-w-7xl relative">
            <div className="text-center space-y-4 mb-20 fade-in-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">Powered by Advanced AI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Transform Your Learning Experience
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of online learning with our powerful AI-driven features
              </p>
            </div>

            <div className="flex flex-col gap-24 lg:gap-32">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-start fade-in-up delay-${(index + 1) * 100}`}
                >
                  <div className={`w-full lg:w-[40%] space-y-8 ${index % 2 === 0 ? '' : 'lg:text-right'}`}>
                    <div>
                      <div className={`inline-flex items-center gap-4 mb-6 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse lg:justify-end'}`}>
                        <div className="relative group/icon">
                          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary/0 rounded-xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm transform hover:scale-110 transition-all duration-300">
                            <feature.icon className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className={`group/btn relative overflow-hidden border-primary/20 hover:border-primary/50 ${index % 2 === 0 ? '' : 'lg:ml-auto'
                        }`}
                    >
                      <span className="relative z-10 flex items-center">
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </span>
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </Button>
                  </div>

                  <div className="w-full lg:w-[60%]">
                    <div className="relative">
                      <FeatureCard className="interactive group p-2 shadow-2xl bg-gradient-to-br from-card/50 to-card/30">
                        <FeatureIllustration icon={feature.icon} title={feature.preview} />
                      </FeatureCard>

                      <div className={`feature-card-label ${index % 2 === 0 ? 'right-10' : 'left-10'}`}>
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
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Benefits Section */}
      <section className="section-dark">
        <RevealOnScroll>
          <div className="background-grid" />
          <div className="background-gradient" />
          <div className="pattern-grid opacity-30" />

          <div className="w-[85%] mx-auto max-w-6xl py-24">
            <div className="text-center max-w-2xl mx-auto mb-16 fade-in-up">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Key Benefits</h2>
              <p className="text-muted-foreground">
                Experience a new way of learning with our comprehensive features
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={benefit.title} className={`relative overflow-hidden transition-colors hover:border-primary/50 fade-in-up delay-${(index + 1) * 100}`}>
                  <CardHeader>
                    <CardTitle>{benefit.title}</CardTitle>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <Footer />
    </div>
  );
}
