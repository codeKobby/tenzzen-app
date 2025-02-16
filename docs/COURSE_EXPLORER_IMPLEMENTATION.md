# Course Explorer Implementation

## 1. Overview

The course explorer page provides course discovery, search, filtering, and detailed course previews using shadcn components. It supports both authenticated and unauthenticated states.

## 2. Implementation

### Course Explorer Page
```tsx
// app/(dashboard)/explore/page.tsx
export default function ExplorePage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    duration: 'all',
    sort: 'popular'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Handle action that requires auth
  const handleAuthRequired = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    // Continue with action
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Explore Courses
          </h1>
          <p className="text-muted-foreground">
            Discover courses created by the community
          </p>
        </div>
        <Button 
          onClick={() => user ? router.push('/generate') : setShowAuthPrompt(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-[300px]"
        />
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.category}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="programming">Programming</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.difficulty}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, difficulty: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onSelect={() => {
              if (user || course.preview) {
                setSelectedCourse(course);
              } else {
                setShowAuthPrompt(true);
              }
            }}
          />
        ))}
      </div>

      {/* Course Preview Dialog */}
      <CoursePreviewDialog
        course={selectedCourse}
        open={!!selectedCourse}
        onOpenChange={() => setSelectedCourse(null)}
        showAuthPrompt={!user}
      />

      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an Account</DialogTitle>
            <DialogDescription>
              Sign up to access full course content and features
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

[Previous implementation continues...]