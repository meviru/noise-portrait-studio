import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-neutral-950 text-neutral-100">
          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-4">Something went wrong</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-violet-700 text-white text-sm rounded"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
