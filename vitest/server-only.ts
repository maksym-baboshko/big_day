// Mock for the `server-only` package in Vitest.
// The real package throws if imported outside a Next.js server context.
// In tests we simply no-op it.
export {};
