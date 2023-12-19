import { FetchBaseQueryMeta } from '@reduxjs/toolkit/dist/query'
import { captureException } from '@sentry/react'

export class ApiValidateError extends Error {
  constructor(res: any, meta: FetchBaseQueryMeta | undefined) {
    super('Data error. Please try again later.')
    const e = new Error(`[API validate fail] ${meta?.request.url}`)
    e.name = 'APIValidateFail'
    captureException(e, { level: 'error', extra: { res, meta } })
  }
}
