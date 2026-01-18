"use client"

import { motion } from "framer-motion"
import { Play, Sparkles, BookOpen, FileText, Brain, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
            delayChildren: 0.2,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
}

const scanLineVariants = {
    initial: { top: "0%" },
    animate: {
        top: ["0%", "100%", "0%"],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
        },
    },
}

const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
}

const extractedItems = [
    { icon: BookOpen, label: "Chapters", count: 8 },
    { icon: FileText, label: "Key Concepts", count: 24 },
    { icon: Brain, label: "Quiz Questions", count: 16 },
]

export function HeroDemo() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-xl rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 shadow-2xl backdrop-blur-sm"
        >
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none" />

            {/* Video Preview Section */}
            <motion.div variants={itemVariants} className="relative p-4 pb-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/80">
                    {/* Fake video thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                        {/* Grid pattern */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                                backgroundSize: "20px 20px"
                            }}
                        />
                    </div>

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            variants={pulseVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl"
                        />
                        <div className="relative p-4 rounded-full bg-primary/90 shadow-lg">
                            <Play className="h-6 w-6 text-primary-foreground fill-current" />
                        </div>
                    </div>

                    {/* Scanning line effect */}
                    <motion.div
                        variants={scanLineVariants}
                        initial="initial"
                        animate="animate"
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none"
                        style={{ boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.5)" }}
                    />

                    {/* Corner markers */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary/60 rounded-tl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary/60 rounded-tr" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary/60 rounded-bl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary/60 rounded-br" />

                    {/* Status badge */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <motion.div
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-primary/30"
                        >
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-white/90">AI Analyzing...</span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Extracted Content Section */}
            <motion.div variants={itemVariants} className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-border via-primary/30 to-border" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extracted Content</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-border via-primary/30 to-border" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {extractedItems.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 + index * 0.2, duration: 0.4 }}
                            className="relative group"
                        >
                            <div className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl",
                                "bg-muted/50 border border-border/50",
                                "group-hover:border-primary/30 group-hover:bg-primary/5",
                                "transition-all duration-300"
                            )}>
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <item.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-center">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.5 + index * 0.2 }}
                                        className="text-lg font-bold text-foreground"
                                    >
                                        {item.count}
                                    </motion.div>
                                    <div className="text-[10px] text-muted-foreground font-medium">{item.label}</div>
                                </div>
                            </div>
                            {/* Completion checkmark */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 2 + index * 0.2, type: "spring", stiffness: 300 }}
                                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-green-500 shadow-md"
                            >
                                <Check className="h-2.5 w-2.5 text-white" />
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Progress bar */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Generating course structure...</span>
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-xs font-medium text-primary"
                    >
                        87%
                    </motion.span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "87%" }}
                        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80"
                    />
                </div>
            </div>
        </motion.div>
    )
}
