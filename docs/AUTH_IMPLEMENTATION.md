# Authentication Implementation with shadcn

## Overview

The authentication system provides a flexible, user-friendly experience that allows feature exploration before requiring signup. It supports both modal-based and standalone page authentication using shadcn components.

## Key Components Used

- Dialog
- Card
- Button
- Input
- Label
- Separator
- Icons
- Form

## Implementation

### Authentication Modal
```tsx
// app/components/auth-dialog.tsx
interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'save_course' | 'continue_generation' | 'unlock_features';
  preservedData?: any; // Data to restore after auth
}

export function AuthDialog({ isOpen, onClose, reason, preservedData }: AuthDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {reason === 'save_course' ? 'Save Your Course' :
             reason === 'continue_generation' ? 'Continue Generation' :
             'Welcome to Tenzzen'}
          </DialogTitle>
          <DialogDescription>
            {reason === 'save_course' ? 
              'Create an account to save your course and access more features' :
             reason === 'continue_generation' ?
              'Sign up to see your complete generated course' :
              'Join our community of learners and unlock personalized features'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Google OAuth */}
          <Button variant="outline" onClick={() => signIn("google")}>
            <Icons.google className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <AuthForm preservedData={preservedData} />
        </div>

        {/* Feature Benefits */}
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Save your favorite courses</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Track your learning progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Generate custom quizzes</span>
          </div>
        </div>

        <DialogFooter className="text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Auth form with state preservation
export function AuthForm({ preservedData }: { preservedData?: any }) {
  const form = useForm<AuthFormData>();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        await signIn('credentials', data);
      } else {
        await signUp(data);
      }
      
      // Restore preserved data if any
      if (preservedData) {
        await restoreUserState(preservedData);
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        {authMode === 'signin' ? (
          <p>
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setAuthMode('signup')}
            >
              Sign up
            </Button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setAuthMode('signin')}
            >
              Sign in
            </Button>
          </p>
        )}
      </div>
    </Form>
  );
}
```

## Features

1. **Progressive Authentication**
   - Allow feature exploration before requiring signup
   - Preserve user progress during authentication
   - Clear value proposition at signup points
   - Seamless authentication flow

2. **Multiple Auth Methods**
   - Email/Password authentication
   - Google OAuth integration
   - Form validation and error handling
   - Data preservation across auth methods

3. **Contextual Authentication**
   - Custom messaging based on auth trigger
   - Progress preservation
   - Feature-specific benefits
   - Clear next steps

4. **User Experience**
   - Smooth transitions
   - Loading states
   - Error handling
   - Success feedback
   - Persistent auth state

## Usage

```tsx
// Example usage in course generation
export function CourseGenerator() {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  
  const handleGenerate = async () => {
    // Generate preview content
    const preview = await generatePreview();
    setGeneratedContent(preview);
    
    // Show auth dialog if user is not authenticated
    if (!user && preview) {
      setShowAuth(true);
    }
  };

  return (
    <>
      <Button onClick={handleGenerate}>
        Generate Course
      </Button>

      {generatedContent && (
        <AuthDialog
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          reason="continue_generation"
          preservedData={generatedContent}
        />
      )}
    </>
  );
}
```

This implementation provides a flexible authentication system that supports feature exploration while maintaining security and user experience best practices.