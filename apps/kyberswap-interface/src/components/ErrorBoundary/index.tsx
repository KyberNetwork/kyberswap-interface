import React, { PropsWithChildren } from 'react'

import FallbackView from 'components/ErrorBoundary/FallbackView'

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    if (
      error.name === 'ChunkLoadError' ||
      /Loading .*?chunk .*? failed/.test(error.message) ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('error loading dynamically imported module') ||
      error.message.includes('Unable to preload CSS for') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.stack?.includes('Failed to fetch dynamically imported module')
    ) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.error !== null) {
      return <FallbackView error={this.state.error} />
    }

    return this.props.children
  }
}
