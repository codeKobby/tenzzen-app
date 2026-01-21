'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { CheckIcon, ChevronRightIcon, InfoIcon, ArrowLeftIcon, SparklesIcon, XIcon, GraduationCap, Briefcase, User, Search, MessageSquare, Share2, Youtube, Layout, Target, Zap, Brain, Quote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const ONBOARDING_ROLES = [
  { id: 'college_student', label: 'College/University Student', icon: <GraduationCap className="h-5 w-5" />, color: 'bg-blue-500/20' },
  { id: 'graduate_student', label: 'Graduate Student', icon: <GraduationCap className="h-5 w-5" />, color: 'bg-purple-500/20' },
  { id: 'high_school', label: 'High School Student', icon: <GraduationCap className="h-5 w-5" />, color: 'bg-emerald-500/20' },
  { id: 'med_student', label: 'Med Student', icon: <GraduationCap className="h-5 w-5" />, color: 'bg-rose-500/20' },
  { id: 'professional', label: 'Professional', icon: <Briefcase className="h-5 w-5" />, color: 'bg-amber-500/20' },
  { id: 'other', label: 'Other', icon: <User className="h-5 w-5" />, color: 'bg-slate-500/20' }
]

const ONBOARDING_SOURCES = [
  { id: 'google', label: 'Google / Web Search', icon: <Search className="h-5 w-5" />, color: 'bg-blue-500/20' },
  { id: 'ai', label: 'ChatGPT / AI Result', icon: <Sparkles className="h-5 w-5" />, color: 'bg-purple-500/20' },
  { id: 'friends', label: 'Friends / Class / School', icon: <MessageSquare className="h-5 w-5" />, color: 'bg-emerald-500/20' },
  { id: 'social', label: 'Social Media', icon: <Share2 className="h-5 w-5" />, color: 'bg-rose-500/20' },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-5 w-5" />, color: 'bg-red-500/20' },
  { id: 'other', label: 'Comparison Site / Others', icon: <Layout className="h-5 w-5" />, color: 'bg-slate-500/20' }
]

const ONBOARDING_GOALS = [
  { id: 'grades', label: 'Get organized & get higher grades for my classes', icon: <Target className="h-5 w-5" />, color: 'bg-purple-500/20' },
  { id: 'exams', label: 'Get ready for a specific exam', icon: <Zap className="h-5 w-5" />, color: 'bg-amber-500/20' },
  { id: 'personal', label: 'Memorize something for a personal learning goal', icon: <Brain className="h-5 w-5" />, color: 'bg-pink-500/20' },
  { id: 'workspace', label: 'Take notes and build a note-taking workspace', icon: <Zap className="h-5 w-5" />, color: 'bg-emerald-500/20' }
]

const TESTIMONIALS = [
  {
    quote: "Tenzzen is my second brain. I transform YouTube tutorials into structured courses instantly. The best part? I actually find things later.",
    author: "Sarah Chen",
    role: "Product Manager",
    color: "bg-blue-500/10 border-blue-500/20"
  },
  {
    quote: "I've tried Notion, Obsidian, Roam... Tenzzen is the one that stuck. The AI-generated quizzes actually help me retain knowledge.",
    author: "Marcus Williams",
    role: "Software Engineer",
    color: "bg-emerald-500/10 border-emerald-500/20"
  },
  {
    quote: "What sold me was how fast I can capture ideas from videos and link them to existing notes. It's like having a personal Wikipedia.",
    author: "Elena Rodriguez",
    role: "Researcher",
    color: "bg-pink-500/10 border-pink-500/20"
  }
]

export default function OnboardingPage() {
  const [step, setStep] = React.useState(0)
  const [formData, setFormData] = React.useState({
    role: '',
    source: '',
    goal: ''
  })
  const [loading, setLoading] = React.useState(false)
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const handleSelect = (field: string, id: string) => {
    setFormData(prev => ({ ...prev, [field]: id }))
    // Auto-advance for the first 3 steps
    if (step < 3) {
      setTimeout(() => setStep(prev => prev + 1), 300)
    }
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = new FormData()
      data.append('role', formData.role)
      data.append('source', formData.source)
      data.append('goal', formData.goal)
      data.append('learningAreas', JSON.stringify([formData.goal])) // Compatibility with existing schema
      data.append('onboardingComplete', 'true')

      const res = await completeOnboarding(data)
      if (res?.message) {
        await user.reload()
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Onboarding failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) return null

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <OnboardingCard title="Who are you?">
            <div className="space-y-3">
              {ONBOARDING_ROLES.map((role, idx) => (
                <OptionButton
                  key={role.id}
                  idx={idx + 1}
                  label={role.label}
                  icon={role.icon}
                  color={role.color}
                  selected={formData.role === role.id}
                  onClick={() => handleSelect('role', role.id)}
                />
              ))}
            </div>
          </OnboardingCard>
        )
      case 1:
        return (
          <OnboardingCard title="How did you first hear about Tenzzen?">
            <div className="space-y-3">
              {ONBOARDING_SOURCES.map((source, idx) => (
                <OptionButton
                  key={source.id}
                  idx={idx + 1}
                  label={source.label}
                  icon={source.icon}
                  color={source.color}
                  selected={formData.source === source.id}
                  onClick={() => handleSelect('source', source.id)}
                />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              This helps us create a personalized experience with the Tenzzen app.
            </p>
          </OnboardingCard>
        )
      case 2:
        return (
          <OnboardingCard title="What do you want to achieve?">
            <div className="space-y-3">
              {ONBOARDING_GOALS.map((goal, idx) => (
                <OptionButton
                  key={goal.id}
                  idx={idx + 1}
                  label={goal.label}
                  icon={goal.icon}
                  color={goal.color}
                  selected={formData.goal === goal.id}
                  onClick={() => handleSelect('goal', goal.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )
      case 3:
        return (
          <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Tenzzen helps you <span className="text-primary">turn YouTube into knowledge</span>
              </h1>
              <p className="text-muted-foreground">
                Join thousands of learners who use AI to master any topic.
              </p>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="mt-4 bg-primary text-primary-foreground px-8 py-3 rounded-md font-medium hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                {loading ? 'Setting up...' : 'Show me how to use Tenzzen'}
                {!loading && <ChevronRightIcon className="h-5 w-5" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={cn("p-6 rounded-2xl border flex flex-col justify-between space-y-4", t.color)}>
                  <Quote className="h-8 w-8 opacity-20" />
                  <p className="text-sm leading-relaxed">
                    {t.quote.split(/\s+/).map((word, j) => (
                      <span key={j} className={cn(
                        ['second', 'brain', 'automatically', 'structured', 'master', 'retention', 'Wikipedia'].some(w => word.toLowerCase().includes(w)) ? "font-bold" : ""
                      )}>{word} </span>
                    ))}
                  </p>
                  <div>
                    <p className="font-bold text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setStep(0)}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              I'll figure everything out myself
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-background to-rose-500/10" />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full flex items-center justify-center"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      
      {step < 3 && (
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          className={cn(
            "fixed bottom-8 left-8 p-3 rounded-full hover:bg-white/5 transition-colors",
            step === 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

function OnboardingCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="max-w-xl w-full bg-[#1c1c21]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-10 tracking-tight">{title}</h1>
      {children}
    </div>
  )
}

function OptionButton({ idx, label, icon, color, selected, onClick }: { idx: number, label: string, icon: React.ReactNode, color: string, selected: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "bg-[#25252a]/50 border border-white/5 hover:bg-[#2d2d33] hover:border-white/10",
        selected && "bg-[#2d2d33] border-white/20 ring-1 ring-white/10"
      )}
    >
      <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg transition-transform group-hover:scale-110", color)}>
        {icon}
      </div>
      <span className="flex-1 text-left font-medium text-slate-200">{label}</span>
      <div className="flex items-center justify-center w-6 h-6 rounded border border-white/10 text-[10px] font-mono text-muted-foreground group-hover:border-white/20">
        {idx}
      </div>
    </button>
  )
}
