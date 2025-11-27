'use client'

import { ErrorBoundary } from './ErrorBoundary'

export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
