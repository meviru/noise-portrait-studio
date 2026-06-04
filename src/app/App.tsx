import { lazy, Suspense } from 'react'
import { ErrorBoundary } from './providers'
import '@/app/styles/globals.css'

const StudioPage = lazy(() => import('@/pages/studio/StudioPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-neutral-950">
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-pulse" />
          </div>
        }
      >
        <StudioPage />
      </Suspense>
    </ErrorBoundary>
  )
}
