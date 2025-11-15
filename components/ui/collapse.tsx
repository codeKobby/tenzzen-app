'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CollapseProps {
  open?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Collapse({ open = false, children, className }: CollapseProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(
    open ? undefined : 0
  );

  React.useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      setHeight(open ? entries[0].target.scrollHeight : 0);
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [open]);

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        className
      )}
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}