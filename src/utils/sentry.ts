import * as Sentry from '@sentry/react'
import { CaptureContext } from '@sentry/types'

export function reportException(e: any, context?: CaptureContext) {
  Sentry.captureException(e, context)
}
