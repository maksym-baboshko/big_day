import { cn } from "@/shared/lib/cn";
import type React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-30 w-full resize-y rounded-xl border bg-bg-primary px-4 py-3 text-text-primary outline-none transition-all duration-300",
        "placeholder:text-text-secondary/90",
        !error &&
          "border-accent/20 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:focus:bg-bg-primary",
        error && "border-error focus:ring-2 focus:ring-error/10",
        "disabled:cursor-not-allowed disabled:border-accent/10 disabled:bg-bg-secondary/30 disabled:text-text-secondary/80",
        className,
      )}
      {...props}
    />
  );
}
