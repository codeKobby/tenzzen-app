import React from "react";
import { formatRelativeTime } from "@/lib/utils/format";

interface RelativeTimeProps {
  date: string | number | Date;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = React.useState(() => formatRelativeTime(date));

  React.useEffect(() => {
    // Update initial state
    setRelativeTime(formatRelativeTime(date));

    // Set up interval to update relative time
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(date));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [date]);

  return (
    <time dateTime={new Date(date).toISOString()} className={className}>
      {relativeTime}
    </time>
  );
}
