"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureIllustrationProps {
    icon: LucideIcon
    title: string
    className?: string
}

const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
}

const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
}

export function FeatureIllustration({ icon: Icon, title, className }: FeatureIllustrationProps) {
    return (
        <div className={cn(
            "relative w-full aspect-[16/9] rounded-xl overflow-hidden",
            "bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40",
            className
        )}>
            {/* Grid pattern background */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: "linear-gradient(rgba(var(--primary-rgb), 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary-rgb), 0.1) 1px, transparent 1px)",
                    backgroundSize: "24px 24px"
                }}
            />

            {/* Animated orbs */}
            <motion.div
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
            />
            <motion.div
                animate={{
                    x: [0, -20, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-primary/5 blur-3xl"
            />

            {/* Center icon with glow */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                    {/* Glow effect */}
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -inset-8 bg-primary/20 rounded-full blur-2xl"
                    />

                    {/* Icon container */}
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card/90 to-card/70 border border-border/50 shadow-xl backdrop-blur-sm">
                        <Icon className="h-12 w-12 text-primary" />
                    </div>
                </motion.div>
            </div>

            {/* Floating mini cards */}
            <motion.div
                variants={gridVariants}
                initial="hidden"
                animate="visible"
                className="absolute inset-0 pointer-events-none"
            >
                {/* Top left card */}
                <motion.div
                    variants={cellVariants}
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 shadow-md backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-medium text-muted-foreground">Active</span>
                    </div>
                </motion.div>

                {/* Bottom right stats */}
                <motion.div
                    variants={cellVariants}
                    className="absolute bottom-4 right-4 px-3 py-2 rounded-lg bg-card/80 border border-border/50 shadow-md backdrop-blur-sm"
                >
                    <div className="text-[10px] text-muted-foreground mb-0.5">Progress</div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-primary rounded-full"
                            />
                        </div>
                        <span className="text-xs font-medium text-foreground">75%</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Title overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
                <span className="text-sm font-medium text-white/90 drop-shadow-md">{title}</span>
            </div>
        </div>
    )
}
