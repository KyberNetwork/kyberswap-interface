type ApiError = {
  status?: number | string
  data?: { code?: number }
}

/**
 * Call only for a failed request that included a cursor. HTTP 400 is broader
 * on cursorless requests, but the API contract uses it for rejected or expired
 * cursors. HTTP 409 means the pinned mutable page target advanced. Both require
 * discarding the full page chain and restarting from page one.
 */
export const shouldResetCursor = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const apiError = error as ApiError
  return apiError.data?.code === 10 || apiError.status === 400 || apiError.status === 409
}

export class CursorResetError extends Error {
  constructor(readonly cause: unknown) {
    super('Cursor collection must restart from page one.')
  }
}
