'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { CheckIcon, ChevronRightIcon, InfoIcon, ArrowLeftIcon, Settings2Icon, SparklesIcon, XIcon } from 'lucide-react'
import { motion } from 'framer-motion'

// Most popular online learning areas
const LEARNING_AREAS = [
  { id: 'web_dev', label: 'Web Development', icon: '💻' },
  { id: 'data_science', label: 'Data Science', icon: '📊' },
  { id: 'ai_ml', label: 'AI & Machine Learning', icon: '🤖' },
  { id: 'mobile_dev', label: 'Mobile Development', icon: '📱' },
  { id: 'cloud_computing', label: 'Cloud Computing', icon: '☁️' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' }
]

// Learning goals
const LEARNING_GOALS = [
  { id: 'professional', label: 'Professional Development', description: 'Enhance skills for career growth' },
  { id: 'academic', label: 'Academic Learning', description: 'Support educational coursework' },
  { id: 'hobby', label: 'Personal Interest/Hobby', description: 'Learn for enjoyment and personal growth' },
  { id: 'certification', label: 'Getting Certified', description: 'Prepare for professional certifications' },
  { id: 'career_change', label: 'Changing Career Path', description: 'Build skills for a new field' }
]

const SKILL_LEVELS = {
  beginner: { label: 'Beginner', description: 'Just starting out' },
  intermediate: { label: 'Intermediate', description: 'Have some experience' },
  advanced: { label: 'Advanced', description: 'Very knowledgeable' },
  expert: { label: 'Expert', description: 'Deep expertise' }
} as const

type FormData = {
  displayName: string
  learningAreas: string[]
  learningGoal: string
  currentSkillLevel: keyof typeof SKILL_LEVELS
  timeCommitment: 'minimal' | 'moderate' | 'significant' | 'intensive'
  referralSource: string
  skillLevels: Record<string, keyof typeof SKILL_LEVELS>
}

export default function OnboardingPage() {
  const [currentPage, setCurrentPage] = React.useState(0)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState<string | null>(null)
  const [customTopic, setCustomTopic] = React.useState('')
  const [customTopics, setCustomTopics] = React.useState<string[]>([])
  const [formData, setFormData] = React.useState<FormData>({
    displayName: '',
    learningAreas: [],
    learningGoal: '',
    currentSkillLevel: 'beginner',
    timeCommitment: 'moderate',
    referralSource: '',
    skillLevels: {}
  })

  const { user, isLoaded } = useUser()
  const router = useRouter()
  const customTopicInputRef = React.useRef<HTMLInputElement>(null)

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
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value) || typeof value === 'object') {
          data.append(key, JSON.stringify(value))
        } else {
          data.append(key, value.toString())
        }
      })

      const res = await completeOnboarding(data)

      if (res?.message) {
        // Reload user data first
        await user.reload()
        // Then redirect to dashboard
        router.push('/dashboard')
      } else if (res?.error) {
        setError(res.error)
      }
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
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

  const handleAddCustomTopic = () => {
    if (customTopic && !customTopics.includes(customTopic)) {
      setCustomTopics(prev => [...prev, customTopic])
      setFormData(prev => ({
        ...prev,
        learningAreas: [...prev.learningAreas, `custom_${customTopic}`]
      }))
      setCustomTopic('')
      if (customTopicInputRef.current) {
        customTopicInputRef.current.focus()
      }
    }
  }

  const handleRemoveCustomTopic = (topic: string) => {
    setCustomTopics(prev => prev.filter(t => t !== topic))
    setFormData(prev => ({
      ...prev,
      learningAreas: prev.learningAreas.filter(area => area !== `custom_${topic}`)
    }))
  }

  const updateSkillLevel = (areaId: string, level: keyof typeof SKILL_LEVELS) => {
    setFormData(prev => ({
      ...prev,
      skillLevels: { ...prev.skillLevels, [areaId]: level }
    }))
  }

  const canProceed = () => {
    switch (currentPage) {
      case 0: // Learning Areas
        return formData.learningAreas.length > 0
      case 1: // Skill Level Rating
        return Object.keys(formData.skillLevels).length > 0
      case 2: // Referral Source
        return true
      case 3: // All Set
        return true
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

  const InfoTooltip = ({ id, text }: { id: string, text: string }) => (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={() => setShowTooltip(showTooltip === id ? null : id)}
        aria-label={`More information about ${id}`}
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {showTooltip === id && (
        <div className="absolute right-0 bottom-full mb-2 p-3 bg-popover border rounded-lg shadow-lg text-xs max-w-[16rem] z-50">
          {text}
          <div className="absolute right-4 bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-popover border-r border-b"></div>
        </div>
      )}
    </div>
  );

  const pages = [
    // Page 1: Learning Areas
    <motion.div
      key="learning-areas"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border shadow-lg p-4 sm:p-6 space-y-6 bg-card"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">What would you like to learn?</h1>
          <InfoTooltip
            id="learning-areas-info"
            text="We'll use these interests to tailor your course recommendations and learning path."
          />
        </div>
        <p className="text-muted-foreground">Choose at least one topic that interests you. We'll use AI to transform related YouTube content into structured, personalized courses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LEARNING_AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => toggleLearningArea(area.id)}
            aria-label={`Toggle ${area.label} learning area`}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${formData.learningAreas.includes(area.id)
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:border-primary/50'
              }`}
          >
            <span className="text-xl">{area.icon}</span>
            <span className="flex-1 text-left">{area.label}</span>
            {formData.learningAreas.includes(area.id) && (
              <CheckIcon className="h-4 w-4 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">
          Other Topics (optional)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={customTopicInputRef}
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTopic()}
            placeholder="Enter a topic and press Enter"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleAddCustomTopic}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 whitespace-nowrap"
          >
            Add Topic
          </button>
        </div>
        {customTopics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {customTopics.map((topic) => (
              <div
                key={topic}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveCustomTopic(topic)}
                  aria-label={`Remove ${topic} topic`}
                  className="hover:text-destructive"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>,

    // Page 2: Skill Level Rating
    <motion.div
      key="skill-level"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border shadow-lg p-4 sm:p-6 space-y-6 bg-card"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rate Your Experience Level</h1>
          <InfoTooltip
            id="skill-level-info"
            text="This helps us customize your learning path by suggesting courses at the right difficulty level."
          />
        </div>
        <p className="text-muted-foreground">For your selected topics, how would you rate your current skill level?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-6">
          {formData.learningAreas.map(areaId => {
            const predefinedArea = LEARNING_AREAS.find(a => a.id === areaId)
            const customArea = areaId.startsWith('custom_') ? areaId.replace('custom_', '') : null
            const areaLabel = predefinedArea?.label || customArea

            if (!areaLabel) return null

            const selectedLevel = formData.skillLevels[areaId] || 'beginner'

            return (
              <div key={areaId} className="space-y-3">
                <label className="font-medium block">{areaLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(SKILL_LEVELS).map(([level, { label, description }]) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateSkillLevel(areaId, level as keyof typeof SKILL_LEVELS)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center gap-1 transition-all ${selectedLevel === level
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>,

    // Page 3: Referral Source
    <motion.div
      key="referral"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border shadow-lg p-4 sm:p-6 space-y-6 bg-card"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Quick Question</h1>
        <p className="text-muted-foreground">How did you hear about Tenzzen?</p>
      </div>

      <input
        type="text"
        value={formData.referralSource}
        onChange={(e) => updateFormData('referralSource', e.target.value)}
        placeholder="e.g. Google, Friend, Social Media"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
      />
    </motion.div>,

    // Page 4: All Set
    <motion.div
      key="all-set"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border shadow-lg p-4 sm:p-6 space-y-6 bg-card text-center"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <SparklesIcon className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">You're All Set!</h1>
        <p className="text-muted-foreground">
          Get ready to experience learning in a whole new way. We'll transform YouTube content into structured,
          personalized courses just for you.
        </p>
      </div>

      <div className="p-4 bg-secondary/30 rounded-lg text-left">
        <h2 className="font-medium mb-2">Your Learning Profile</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <span className="text-muted-foreground">Topics:</span>{' '}
            {formData.learningAreas.map(areaId => {
              const area = LEARNING_AREAS.find(a => a.id === areaId)
              return area ? area.label : areaId.replace('custom_', '')
            }).join(', ')}
          </li>
          <li className="space-y-1">
            <span className="text-muted-foreground block">Experience Levels:</span>
            <div className="pl-2">
              {formData.learningAreas.map(areaId => {
                const area = LEARNING_AREAS.find(a => a.id === areaId)
                const level = formData.skillLevels[areaId] || 'beginner'
                return (
                  <div key={areaId}>
                    {area?.label || areaId.replace('custom_', '')}: {SKILL_LEVELS[level].label}
                  </div>
                )
              })}
            </div>
          </li>
        </ul>
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
      <div className="pattern-dots"></div>
      <div className="background-gradient"></div>

      <div className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col">
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span>Start</span>
            <span>Complete</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
            ></div>
          </div>
        </div>

        <div className="flex-1">
          {pages[currentPage]}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

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
              ? loading ? 'Processing...' : 'Get Started'
              : 'Continue'
            }
            {!loading && currentPage < pages.length - 1 && <ChevronRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
