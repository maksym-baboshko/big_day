"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-cinzel text-2xl">Something went wrong</h1>
      <button type="button" onClick={reset} className="underline underline-offset-4">
        Try again
      </button>
    </div>
  );
}
