"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Error Boundary]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="max-w-md text-center">
        <p className="heading-serif mb-2 text-3xl text-text-primary">
          Щось пішло не так
        </p>
        <p className="heading-serif mb-1 text-lg text-text-secondary italic">
          Something went wrong
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-text-secondary/60">
            {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
        >
          Спробувати знову · Try again
        </button>
      </div>
    </div>
  );
}
