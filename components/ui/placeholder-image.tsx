"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Film } from "lucide-react";

type PlaceholderImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
};

export function PlaceholderImage({
  src,
  alt = "Image",
  className,
  fallbackClassName,
}: PlaceholderImageProps) {
  const [error, setError] = useState(false);

  // If src is empty string or null, show fallback immediately
  const shouldShowFallback = !src || src.trim() === '' || error;

  return shouldShowFallback ? (
    <div
      className={cn(
        "flex items-center justify-center bg-muted h-full w-full",
        fallbackClassName
      )}
      aria-label={alt}
    >
      <Film className="h-[30%] w-[30%] text-muted-foreground/40" />
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}