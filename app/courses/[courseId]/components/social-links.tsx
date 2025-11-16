"use client"

import { Button } from "@/components/ui/button"
import {
    Github,
    Twitter,
    Linkedin,
    Instagram,
    Youtube,
    Facebook,
    MessageCircle,
    Globe,
    ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialLink {
    title: string
    url: string
    type: string
    description?: string
    category?: string
}

interface SocialLinksProps {
    resources: SocialLink[]
    className?: string
    size?: "sm" | "default" | "lg"
}

// Map platform names to icons
const getSocialIcon = (title: string, url: string) => {
    const lowerTitle = title.toLowerCase()
    const lowerUrl = url.toLowerCase()

    if (lowerTitle.includes('github') || lowerUrl.includes('github.com')) {
        return <Github className="h-4 w-4" />
    }
    if (lowerTitle.includes('twitter') || lowerTitle.includes('x.com') || lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        return <Twitter className="h-4 w-4" />
    }
    if (lowerTitle.includes('linkedin') || lowerUrl.includes('linkedin.com')) {
        return <Linkedin className="h-4 w-4" />
    }
    if (lowerTitle.includes('instagram') || lowerUrl.includes('instagram.com')) {
        return <Instagram className="h-4 w-4" />
    }
    if (lowerTitle.includes('youtube') || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return <Youtube className="h-4 w-4" />
    }
    if (lowerTitle.includes('facebook') || lowerUrl.includes('facebook.com')) {
        return <Facebook className="h-4 w-4" />
    }
    if (lowerTitle.includes('tiktok') || lowerUrl.includes('tiktok.com')) {
        return <MessageCircle className="h-4 w-4" /> // Using MessageCircle for TikTok as lucide-react doesn't have native TikTok icon
    }
    if (lowerTitle.includes('discord') || lowerUrl.includes('discord')) {
        return <MessageCircle className="h-4 w-4" />
    }
    if (lowerTitle.includes('website') || lowerTitle.includes('blog') || lowerTitle.includes('portfolio')) {
        return <Globe className="h-4 w-4" />
    }

    return <ExternalLink className="h-4 w-4" />
}

export function SocialLinks({ resources, className, size = "default" }: SocialLinksProps) {
    // Filter for social links
    const socialLinks = resources.filter(r =>
        r.category === "Social" ||
        r.type === "Social" ||
        r.title?.toLowerCase().includes('twitter') ||
        r.title?.toLowerCase().includes('github') ||
        r.title?.toLowerCase().includes('linkedin') ||
        r.title?.toLowerCase().includes('instagram') ||
        r.title?.toLowerCase().includes('youtube') ||
        r.title?.toLowerCase().includes('facebook') ||
        r.title?.toLowerCase().includes('tiktok') ||
        r.title?.toLowerCase().includes('discord') ||
        r.url?.includes('twitter.com') ||
        r.url?.includes('x.com') ||
        r.url?.includes('github.com') ||
        r.url?.includes('linkedin.com') ||
        r.url?.includes('instagram.com') ||
        r.url?.includes('youtube.com') ||
        r.url?.includes('facebook.com') ||
        r.url?.includes('tiktok.com') ||
        r.url?.includes('discord')
    )

    if (socialLinks.length === 0) {
        return null
    }

    const sizeClasses = {
        sm: "h-8 w-8",
        default: "h-9 w-9",
        lg: "h-10 w-10"
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {socialLinks.map((link, index) => (
                <Button
                    key={index}
                    variant="outline"
                    size="icon"
                    className={cn(sizeClasses[size], "shrink-0")}
                    asChild
                    title={link.description || link.title}
                >
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.title}
                    >
                        {getSocialIcon(link.title, link.url)}
                    </a>
                </Button>
            ))}
        </div>
    )
}
