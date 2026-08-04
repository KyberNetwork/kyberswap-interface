const ancestorOrigins = typeof window !== 'undefined' ? window.location.ancestorOrigins : undefined

export const SAFE_APP_CLIENT_ID = 'app.safe.global'

export const isInSafeApp = !!ancestorOrigins?.[ancestorOrigins.length - 1]?.includes('app.safe.global')
