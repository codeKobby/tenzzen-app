"use client";

import React from "react";

interface PlaceholderImageProps {
  title: string;
}

export function PlaceholderImage({ title }: PlaceholderImageProps) {
  return (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <div className="text-center p-4">
        <div className="text-2xl font-semibold text-primary/50 mb-2">Screenshot Preview</div>
        <div className="text-muted-foreground">{title}</div>
      </div>
    </div>
  );
}