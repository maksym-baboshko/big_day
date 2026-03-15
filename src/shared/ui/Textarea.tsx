import { cn } from "@/shared/lib/cn";
import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full px-4 py-3 rounded-xl border bg-bg-primary transition-all duration-300 outline-none min-h-[120px] resize-y",
        "placeholder:text-text-secondary/90 text-text-primary",
        !error && "border-accent/28 focus:border-accent focus:ring-2 focus:ring-accent/16 focus:bg-white dark:focus:bg-bg-primary",
        error && "border-red-500 focus:ring-2 focus:ring-red-500/10",
        "disabled:cursor-not-allowed disabled:border-accent/18 disabled:bg-bg-secondary/35 disabled:text-text-secondary/90",
        className
      )}
      {...props}
    />
  );
}
