'use client';

import { ReactNode } from "react";

interface MetadataItem {
  icon: ReactNode;
  text: string;
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  metadata?: MetadataItem[];
}

export function PanelHeader({ title, subtitle, metadata }: PanelHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
      
      {metadata && metadata.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.icon}
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}