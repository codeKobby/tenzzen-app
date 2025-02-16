# Landing Page Implementation with shadcn

## Overview

The landing page provides an interactive introduction to the platform, allowing users to experience core features before signing up while maintaining professional design and clear value proposition.

## Key Components

### 1. Hero Section
```tsx
// components/landing/hero-section.tsx
export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10" />
      
      <div className="container relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Transform YouTube Videos into
              <span className="text-primary"> Structured Courses</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              AI-powered course generation from any YouTube video. Perfect for 
              self-paced learning and content organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => setShowDemo(true)}>
                Try Demo Generation
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Create Free Account</Link>
              </Button>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-card">
            <DemoVideo />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 2. Interactive Demo
```tsx
// components/landing/course-demo.tsx
export function CourseDemo() {
  const [demoStep, setDemoStep] = useState<number>(1);
  const [videoUrl, setVideoUrl] = useState<string>('');

  return (
    <Dialog>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Generate Your First Course</DialogTitle>
          <DialogDescription>
            Try the course generation process without signing up
          </DialogDescription>
        </DialogHeader>

        {/* Demo Steps */}
        <div className="space-y-6">
          {/* Step 1: Video URL */}
          {demoStep === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Paste YouTube URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!videoUrl}
                onClick={() => setDemoStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Course Structure Preview */}
          {demoStep === 2 && (
            <div className="space-y-4">
              <div className="animate-in fade-in-50">
                <CourseStructurePreview url={videoUrl} />
              </div>
              <Alert>
                <AlertTitle>Ready to save your course?</AlertTitle>
                <AlertDescription>
                  Create a free account to save this course and access all features
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Feature Showcase
```tsx
// components/landing/feature-grid.tsx
export function FeatureGrid() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-4">
            Our AI analyzes video content and creates structured learning experiences
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="p-2 w-fit rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <feature.demo />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 4. Social Proof
```tsx
// components/landing/testimonials.tsx
export function Testimonials() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold">Loved by Learners</h2>
          <p className="text-muted-foreground mt-4">
            See what our community has to say about their learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {testimonial.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription>
                      {testimonial.title}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {testimonial.quote}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 5. Footer
```tsx
// components/landing/footer.tsx
export function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="space-y-4">
            <TenzzenLogo className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">
              Transform YouTube videos into structured learning experiences
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
              </li>
              {/* More links */}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
              </li>
              {/* More links */}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              {/* More links */}
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Tenzzen. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="https://twitter.com/tenzzen" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="https://github.com/tenzzen" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

## Free Trial Features

### 1. Demo Generation
- Allow users to input any YouTube URL
- Show AI analysis and course structure
- Preview first section of generated content
- Prompt for signup to save and access full course

### 2. Feature Previews
- Interactive demos of key features
- Visual walkthroughs of the process
- Sample course structures
- Example quiz generation

### 3. Conversion Points
- Strategic CTAs throughout the page
- Clear value proposition at each step
- Seamless transition to signup
- Progress preservation after signup

## Visual Assets

### 1. Screenshots & Videos
- Course generation process
- Dashboard interface
- Quiz taking experience
- Note-taking features

### 2. Animations
- Smooth scroll transitions
- Feature hover effects
- Process flow animations
- Loading states

This implementation provides an engaging landing page that allows users to experience the platform's core features before committing to signup while maintaining professional design standards.