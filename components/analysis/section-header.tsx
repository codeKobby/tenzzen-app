'use client';

interface SectionHeaderProps {
  title: string;
  description?: string;
  metadata?: string;
}

export function SectionHeader({ title, description, metadata }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {metadata && (
        <span className="text-sm text-muted-foreground">{metadata}</span>
      )}
    </div>
  );
}