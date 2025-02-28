'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { CheckIcon, ChevronRightIcon, InfoIcon, SkipForwardIcon, ArrowLeftIcon, BookOpenIcon, GraduationCapIcon, Settings2Icon, BrainIcon, SparklesIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Learning areas with icons
const LEARNING_AREAS = [
  { id: 'programming', label: 'Programming & Development', icon: '💻' },
  { id: 'design', label: 'Design & Creative', icon: '🎨' },
  { id: 'business', label: 'Business & Entrepreneurship', icon: '💼' },
  { id: 'data_science', label: 'Data Science & Analytics', icon: '📊' },
  { id: 'languages', label: 'Language Learning', icon: '🗣️' },
  { id: 'marketing', label: 'Marketing & Communication', icon: '📣' },
  { id: 'personal_dev', label: 'Personal Development', icon: '🌱' },
  { id: 'academics', label: 'Academic Subjects', icon: '📚' },
  { id: 'tech', label: 'Technology & IT', icon: '⚙️' },
  { id: 'health', label: 'Health & Wellness', icon: '🧠' },
]

// Learning goals
const LEARNING_GOALS = [
  { id: 'professional', label: 'Professional Development', description: 'Enhance skills for career growth' },
  { id: 'academic', label: 'Academic Learning', description: 'Support educational coursework' },
  { id: 'hobby', label: 'Personal Interest/Hobby', description: 'Learn for enjoyment and personal growth' },
  { id: 'certification', label: 'Getting Certified', description: 'Prepare for professional certifications' },
  { id: 'career_change', label: 'Changing Career Path', description: 'Build skills for a new field' },
]

// Learning preferences
const LEARNING_PREFERENCES = [
  { id: 'visual', label: 'Visual Learning', description: 'Learn best through diagrams, charts, and videos' },
  { id: 'auditory', label: 'Auditory Learning', description: 'Learn best by listening to explanations' },
  { id: 'reading_writing', label: 'Reading/Writing', description: 'Learn best through text-based materials' },
  { id: 'kinesthetic', label: 'Hands-on Learning', description: 'Learn best through practical exercises' },
  { id: 'social', label: 'Social Learning', description: 'Learn best in groups or discussions' },
  { id: 'solitary', label: 'Self-paced Learning', description: 'Learn best when studying alone' },
]

export default function OnboardingPage() {
  const [currentPage, setCurrentPage] = React.useState(0)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    displayName: '',
    learningAreas: [] as string[],
    learningGoal: '',
    currentSkillLevel: 'beginner',
    learningPreferences: [] as string[],
    timeCommitment: 'moderate',
    referralSource: '',
  })

  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Pre-fill name from Clerk if available
  React.useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || ''
      }))
    }
  }, [isLoaded, user])

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value))
        } else {
          data.append(key, value.toString())
        }
      })

      const res = await completeOnboarding(data)

      if (res?.message) {
        // Force a hard navigation to ensure state is reset
        window.location.href = '/dashboard'
      } else if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleLearningArea = (areaId: string) => {
    setFormData(prev => {
      const areas = [...prev.learningAreas]
      if (areas.includes(areaId)) {
        return { ...prev, learningAreas: areas.filter(id => id !== areaId) }
      } else {
        return { ...prev, learningAreas: [...areas, areaId] }
      }
    })
  }

  const toggleLearningPreference = (prefId: string) => {
    setFormData(prev => {
      const prefs = [...prev.learningPreferences]
      if (prefs.includes(prefId)) {
        return { ...prev, learningPreferences: prefs.filter(id => id !== prefId) }
      } else {
        return { ...prev, learningPreferences: [...prefs, prefId] }
      }
    })
  }

  const canProceed = () => {
    switch (currentPage) {
      case 0: // Welcome page - can always proceed
        return true
      case 1: // Learning Areas
        return formData.learningAreas.length > 0
      case 2: // Learning Goals
        return formData.learningGoal !== ''
      case 3: // Learning Preferences
        return formData.learningPreferences.length > 0
      default:
        return true
    }
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      handleSubmit()
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  const skipToFinal = () => {
    setCurrentPage(pages.length - 1)
    window.scrollTo(0, 0)
  }

  const InfoTooltip = ({ id, text }: { id: string, text: string }) => (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={() => setShowTooltip(showTooltip === id ? null : id)}
        aria-label="More information"
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {showTooltip === id && (
        <div className="absolute left-0 bottom-full mb-2 p-3 bg-popover border rounded-lg shadow-lg text-xs w-64 z-50">
          {text}
          <div className="absolute left-1 bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b"></div>
        </div>
      )}
    </div>
  );

  const pages = [
    // Page 1: Welcome - Enhanced with better messaging
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <SparklesIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transform How You Learn
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">
          Tenzzen turns YouTube chaos into structured, personalized courses.
          Say goodbye to distractions and hello to focused learning.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg -z-10" />
        <div className="grid sm:grid-cols-2 gap-6 p-6 rounded-lg border relative">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <BookOpenIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">AI-Powered Organization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Our AI extracts and organizes key concepts from videos into coherent courses tailored to your goals.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <GraduationCapIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Distraction-Free Learning</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Focus on what matters with our clean interface designed for deep learning without YouTube's distractions.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden bg-card">
        <div className="bg-secondary/50 px-6 py-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Settings2Icon className="h-4 w-4" />
            Let's Personalize Your Experience, {formData.displayName.split(' ')[0] || 'Learner'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1">Your Name</div>
              <div className="font-semibold text-lg">{formData.displayName || 'New User'}</div>
            </div>
            {formData.displayName && (
              <div className="flex items-center text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                <CheckIcon className="h-3 w-3 mr-1" /> Imported from your account
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium">In the next few steps, you'll:</div>

            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">1</div>
                <div>
                  <div className="font-medium">Select your learning interests</div>
                  <div className="text-sm text-muted-foreground">Choose topics you want to explore</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">2</div>
                <div>
                  <div className="font-medium">Define your learning goals</div>
                  <div className="text-sm text-muted-foreground">Helps us tailor content to your needs</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">3</div>
                <div>
                  <div className="font-medium">Share your learning preferences</div>
                  <div className="text-sm text-muted-foreground">Optimize content for your learning style</div>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mt-4 pt-4 border-t">
              This will take less than a minute. You can always change these preferences later in your account settings.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={skipToFinal}
        >
          Skip personalization
        </button>
      </div>
    </motion.div>,

    // Page 2: Learning Areas
    <motion.div
      key="learning-areas"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">What would you like to learn?</h1>
          <InfoTooltip
            id="learning-areas-info"
            text="We'll use these interests to recommend relevant courses and content. Select as many as you're interested in."
          />
        </div>
        <p className="text-muted-foreground">Select topics you're interested in (choose at least one)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LEARNING_AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => toggleLearningArea(area.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${formData.learningAreas.includes(area.id)
              ? 'border-primary bg-primary/10 text-primary font-medium'
              : 'border-border hover:border-primary/50'
              }`}
          >
            <span className="text-xl">{area.icon}</span>
            <span>{area.label}</span>
            {formData.learningAreas.includes(area.id) && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={skipToFinal}
        >
          <SkipForwardIcon className="h-3 w-3" />
          Skip personalization
        </button>
      </div>
    </motion.div>,

    // Page 3: Learning Goals
    <motion.div
      key="learning-goals"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">What's your primary goal?</h1>
          <InfoTooltip
            id="learning-goals-info"
            text="Understanding your goals helps us tailor course recommendations to match your needs and desired outcomes."
          />
        </div>
        <p className="text-muted-foreground">This helps us recommend the right content for you</p>
      </div>

      <div className="space-y-3">
        {LEARNING_GOALS.map((goal) => (
          <label
            key={goal.id}
            className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${formData.learningGoal === goal.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50'
              }`}
          >
            <input
              type="radio"
              name="learningGoal"
              value={goal.id}
              checked={formData.learningGoal === goal.id}
              onChange={() => updateFormData('learningGoal', goal.id)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${formData.learningGoal === goal.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border'
              }`}>
              {formData.learningGoal === goal.id && <CheckIcon className="h-3 w-3" />}
            </div>
            <div>
              <div className={formData.learningGoal === goal.id ? 'font-medium' : ''}>{goal.label}</div>
              <div className="text-xs text-muted-foreground">{goal.description}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="currentSkillLevel" className="text-sm font-medium">
            How would you rate your current skill level?
          </label>
          <InfoTooltip
            id="skill-level-info"
            text="We'll adjust the difficulty of recommended courses based on your expertise level."
          />
        </div>
        <select
          id="currentSkillLevel"
          value={formData.currentSkillLevel}
          onChange={(e) => updateFormData('currentSkillLevel', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="beginner">Beginner - Just starting out</option>
          <option value="intermediate">Intermediate - Have some experience</option>
          <option value="advanced">Advanced - Proficient in the field</option>
          <option value="expert">Expert - Deep expertise</option>
        </select>
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={skipToFinal}
        >
          <SkipForwardIcon className="h-3 w-3" />
          Skip remaining steps
        </button>
      </div>
    </motion.div>,

    // Page 4: Learning Preferences
    <motion.div
      key="learning-preferences"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">How do you prefer to learn?</h1>
          <InfoTooltip
            id="preferences-info"
            text="This helps us recommend courses with teaching styles that match how you learn best."
          />
        </div>
        <p className="text-muted-foreground">Select all that apply to you</p>
      </div>

      <div className="space-y-3">
        {LEARNING_PREFERENCES.map((pref) => (
          <label
            key={pref.id}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${formData.learningPreferences.includes(pref.id)
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
              }`}
          >
            <input
              type="checkbox"
              name="learningPreferences"
              value={pref.id}
              checked={formData.learningPreferences.includes(pref.id)}
              onChange={() => toggleLearningPreference(pref.id)}
              className="sr-only"
            />
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${formData.learningPreferences.includes(pref.id)
              ? 'bg-primary text-primary-foreground'
              : 'border border-border'
              }`}>
              {formData.learningPreferences.includes(pref.id) && <CheckIcon className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className={formData.learningPreferences.includes(pref.id) ? 'font-medium' : ''}>
                {pref.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{pref.description}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="timeCommitment" className="text-sm font-medium">
            How much time can you dedicate to learning each week?
          </label>
          <InfoTooltip
            id="time-commitment-info"
            text="This helps us suggest courses that fit into your schedule and learning pace."
          />
        </div>
        <select
          id="timeCommitment"
          value={formData.timeCommitment}
          onChange={(e) => updateFormData('timeCommitment', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="minimal">Minimal (1-2 hours/week)</option>
          <option value="moderate">Moderate (3-5 hours/week)</option>
          <option value="significant">Significant (6-10 hours/week)</option>
          <option value="intensive">Intensive (10+ hours/week)</option>
        </select>
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={skipToFinal}
        >
          <SkipForwardIcon className="h-3 w-3" />
          Skip and finish
        </button>
      </div>
    </motion.div>,

    // Page 5: Referral Source (Optional) - Changed to input field with suggestions
    <motion.div
      key="referral"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">One last thing...</h1>
        <p className="text-muted-foreground">We'd love to know how you found us (optional)</p>
      </div>

      <div className="space-y-3">
        <label htmlFor="referralSource" className="text-sm font-medium">
          How did you hear about Tenzzen?
        </label>
        <input
          id="referralSource"
          type="text"
          value={formData.referralSource}
          onChange={(e) => updateFormData('referralSource', e.target.value)}
          placeholder="e.g. YouTube, Google Search, Friend recommendation"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
        />
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Some examples: YouTube ad, Google search, Twitter, Friend recommendation, School/University, etc.</p>
        </div>
      </div>

      <div className="p-5 rounded-lg bg-secondary/30 border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">You're all set!</h3>
            <p className="text-sm text-muted-foreground">Click "Finish" to start your personalized learning experience.</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-secondary/30 rounded-lg border">
        <h2 className="font-semibold">Your preferences summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          {formData.learningAreas.length > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground">Interests</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.learningAreas.map(areaId => (
                  <span key={areaId} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {LEARNING_AREAS.find(a => a.id === areaId)?.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No learning interests selected</div>
          )}

          {formData.learningGoal ? (
            <div>
              <div className="text-xs text-muted-foreground">Primary goal</div>
              <div>{LEARNING_GOALS.find(g => g.id === formData.learningGoal)?.label}</div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No learning goal selected</div>
          )}

          {formData.learningPreferences.length > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground">Learning style</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.learningPreferences.map(prefId => (
                  <span key={prefId} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {LEARNING_PREFERENCES.find(p => p.id === prefId)?.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No learning preferences selected</div>
          )}
        </div>
      </div>
    </motion.div>,
  ];

  // Wait for user data to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background elements */}
      <div className="pattern-dots"></div>
      <div className="background-gradient"></div>

      <div className="flex-1 w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span>Start</span>
            <span>Complete</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {pages[currentPage]}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between items-center">
          {currentPage > 0 ? (
            <button
              type="button"
              onClick={prevPage}
              className="flex items-center justify-center gap-1 px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div></div>
          )}

          <div className="text-xs text-muted-foreground">
            {currentPage + 1} of {pages.length}
          </div>

          <button
            type="button"
            onClick={nextPage}
            disabled={!canProceed() || loading}
            className={`flex items-center justify-center gap-1 px-5 py-2 rounded-md font-medium transition-all ${canProceed() && !loading
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-primary/50 text-primary-foreground/70 cursor-not-allowed'
              }`}
          >
            {currentPage === pages.length - 1
              ? loading ? 'Processing...' : 'Finish'
              : 'Next'
            }
            {!loading && currentPage < pages.length - 1 && <ChevronRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
