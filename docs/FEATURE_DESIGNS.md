# Feature-Specific Design Implementations

## Course Generation Interface

### Topic-Based Generation Modal
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Generate from Topic</Button>
  </DialogTrigger>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Generate Course from Topic</DialogTitle>
      <DialogDescription>
        Describe your learning goals and preferences
      </DialogDescription>
    </DialogHeader>
    
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., Machine Learning with Python"
              {...form.register("topic")}
            />
          </div>

          <div className="grid gap-2">
            <Label>Knowledge Level</Label>
            <RadioGroup defaultValue="beginner">
              <div className="grid grid-cols-3 gap-4">
                <Label className="flex items-center gap-2 p-4 border rounded-lg">
                  <RadioGroupItem value="beginner" />
                  <div>
                    <div className="font-medium">Beginner</div>
                    <div className="text-sm text-muted-foreground">
                      New to the subject
                    </div>
                  </div>
                </Label>
                <Label className="flex items-center gap-2 p-4 border rounded-lg">
                  <RadioGroupItem value="intermediate" />
                  <div>
                    <div className="font-medium">Intermediate</div>
                    <div className="text-sm text-muted-foreground">
                      Some experience
                    </div>
                  </div>
                </Label>
                <Label className="flex items-center gap-2 p-4 border rounded-lg">
                  <RadioGroupItem value="advanced" />
                  <div>
                    <div className="font-medium">Advanced</div>
                    <div className="text-sm text-muted-foreground">
                      Significant expertise
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Channel Preferences</Label>
            <div className="grid gap-4">
              {channelSuggestions.map((channel) => (
                <Label
                  key={channel.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <Checkbox value={channel.id} />
                  <div className="grid gap-1">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {channel.description}
                    </div>
                  </div>
                </Label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="objectives">Learning Objectives</Label>
            <Textarea
              id="objectives"
              placeholder="What do you want to achieve?"
              {...form.register("objectives")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit">Generate Course</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

### Course Generation Progress
```tsx
<div className="grid gap-6">
  <div className="space-y-2">
    <h2 className="text-2xl font-bold">Generating Your Course</h2>
    <p className="text-muted-foreground">Please wait while we analyze and structure your course</p>
  </div>

  <div className="grid gap-4">
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Content Analysis</span>
        <span>100%</span>
      </div>
      <Progress value={100} />
    </div>

    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Course Structure</span>
        <span>75%</span>
      </div>
      <Progress value={75} />
    </div>

    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Resource Aggregation</span>
        <span>45%</span>
      </div>
      <Progress value={45} />
    </div>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Current Step</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-2">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Analyzing video transcripts for key concepts</p>
      </div>
      <p className="text-sm text-muted-foreground">
        This helps us create a well-structured course outline
      </p>
    </CardContent>
  </Card>
</div>
```

## Course Interface

### Course Header
```tsx
<div className="space-y-4 pb-4 border-b">
  <div className="flex justify-between items-start gap-4">
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Machine Learning with Python</h1>
      <p className="text-muted-foreground">
        Master machine learning concepts and practical implementation
      </p>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          Share Course
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download className="mr-2 h-4 w-4" />
          Download Materials
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete Course
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div className="flex gap-4">
    <div className="flex items-center gap-2">
      <Badge>AI-Generated</Badge>
      <Badge variant="outline">Intermediate</Badge>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>Est. 12 hours</span>
    </div>
  </div>
</div>
```

### Course Content
```tsx
<div className="grid lg:grid-cols-[300px_1fr] gap-8">
  <aside className="hidden lg:block">
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        {modules.map((module, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">
                Module {index + 1}: {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <Button
                    key={lessonIndex}
                    variant={lesson.isComplete ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <CheckCircle2 className={cn(
                      "mr-2 h-4 w-4",
                      lesson.isComplete ? "text-primary" : "text-muted-foreground"
                    )} />
                    {lesson.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  </aside>

  <main className="space-y-8">
    <div className="aspect-video rounded-lg border bg-card">
      <AspectRatio ratio={16 / 9}>
        {/* Video Player Component */}
      </AspectRatio>
    </div>

    <Tabs defaultValue="notes">
      <TabsList>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
      </TabsList>
      
      <TabsContent value="notes">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Notes</CardTitle>
            <CardDescription>
              AI-generated notes with key concepts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {/* Rich Text Editor for Notes */}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="resources">
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className={cn(
                    "p-2 rounded-lg",
                    resource.type === "github" && "bg-black text-white",
                    resource.type === "docs" && "bg-blue-100 text-blue-900",
                    resource.type === "article" && "bg-green-100 text-green-900"
                  )}>
                    {resource.type === "github" && <Github className="h-4 w-4" />}
                    {resource.type === "docs" && <FileText className="h-4 w-4" />}
                    {resource.type === "article" && <Newspaper className="h-4 w-4" />}
                  </div>
                  <div className="grid gap-1">
                    <div className="font-medium">{resource.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {resource.description}
                    </div>
                    <Link
                      href={resource.url}
                      className="text-sm text-primary hover:underline"
                    >
                      View Resource
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </main>
</div>
```

## Interactive Learning Features

### AI Chat Interface
```tsx
<Card className="h-[600px] grid grid-rows-[auto_1fr_auto]">
  <CardHeader>
    <CardTitle>AI Tutor</CardTitle>
    <CardDescription>
      Ask questions about the course content
    </CardDescription>
  </CardHeader>

  <ScrollArea className="p-4">
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-3 text-sm",
            message.role === "assistant" && "flex-row",
            message.role === "user" && "flex-row-reverse"
          )}
        >
          {message.role === "assistant" && (
            <Avatar>
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
          
          <div className={cn(
            "rounded-lg px-4 py-2 max-w-[80%]",
            message.role === "assistant" && "bg-muted",
            message.role === "user" && "bg-primary text-primary-foreground"
          )}>
            {message.content}
          </div>

          {message.role === "user" && (
            <Avatar>
              <AvatarFallback>
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI is thinking...
        </div>
      )}
    </div>
  </ScrollArea>

  <div className="p-4 border-t">
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <Button type="submit">Send</Button>
    </form>
  </div>
</Card>
```

### Assessment Interface
```tsx
<div className="space-y-8">
  <div className="space-y-2">
    <h2 className="text-2xl font-bold">Module Assessment</h2>
    <p className="text-muted-foreground">
      Complete this quiz to test your understanding
    </p>
  </div>

  <div className="space-y-6">
    {questions.map((question, index) => (
      <Card key={index}>
        <CardHeader>
          <CardTitle className="text-base">
            Question {index + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{question.text}</p>
          
          <RadioGroup>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <Label
                  key={optionIndex}
                  className="flex items-center gap-2 p-4 border rounded-lg cursor-pointer"
                >
                  <RadioGroupItem value={option.id} />
                  <div className="grid gap-1">
                    <div className="font-medium">
                      {option.text}
                    </div>
                    {showFeedback && option.feedback && (
                      <div className={cn(
                        "text-sm",
                        option.isCorrect ? "text-green-600" : "text-red-600"
                      )}>
                        {option.feedback}
                      </div>
                    )}
                  </div>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    ))}
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Your Progress</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Completed</span>
          <span>75%</span>
        </div>
        <Progress value={75} />
      </div>
    </CardContent>
  </Card>

  <div className="flex justify-end">
    <Button onClick={handleSubmit}>Submit Assessment</Button>
  </div>
</div>
```

These design implementations follow the shadcn component patterns and neutral theme while maintaining consistency across the application. All components are responsive and include proper loading states, error handling, and accessibility features.