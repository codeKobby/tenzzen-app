// filepath: c:\Users\kgeor\Desktop\New folder (2)\tenzzen-app\app\admin\components\spinner.tsx
import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Spinner({ className, ...props }: SpinnerProps) {
    return (
        <div
            className={`animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full ${className || ""}`}
            {...props}
        >
            <span className="sr-only">Loading</span>
        </div>
    );
}