import { captureException } from '@sentry/react'
import React, { ErrorInfo, PropsWithChildren } from 'react'

import FallbackView from 'components/ErrorBoundary/FallbackView'

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<
  PropsWithChildren<{ captureError?: boolean }>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { captureError = true } = this.props
    if (!captureError) {
      return
    }
    if (
      error.name === 'ChunkLoadError' ||
      /Loading .*?chunk .*? failed/.test(error.message) ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.stack?.includes('Failed to fetch dynamically imported module')
    ) {
      const e = new Error(`[ChunkLoadError] ${error.message}`)
      e.name = 'ChunkLoadError'
      e.stack = ''
      captureException(e, { level: 'warning', extra: { error, errorInfo } })
      return window.location.reload()
    }

    const e = new Error(`[${error.name}] ${error.message}`, {
      cause: error,
    })
    e.name = 'AppCrash'
    e.stack = ''
    captureException(e, { level: 'fatal', extra: { error, errorInfo } })
  }

  render() {
    const { error } = this.state
    const { captureError = true } = this.props

    if (error !== null && captureError) {
      return <FallbackView error={error} />
    }

    return this.props.children
  }
}
