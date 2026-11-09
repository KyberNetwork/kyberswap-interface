import { TURNSTILE_SITE_KEY } from 'constants/env'

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileRenderOptions = {
  sitekey: string
  action?: string
  execution?: 'render' | 'execute'
  appearance?: 'always' | 'execute' | 'interaction-only'
  callback?: (token: string) => void
  'error-callback'?: (errorCode?: string) => void
  'expired-callback'?: () => void
}

type TurnstileApi = {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string
  execute: (container: string | HTMLElement) => void
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined

// Loads the Turnstile script once and resolves with its API.
export const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')))
      script.onerror = () => {
        scriptPromise = undefined
        script.remove()
        reject(new Error('Failed to load Turnstile'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// Renders a widget in `container`, runs the challenge and resolves with a single-use token.
// Tokens expire after 5 minutes, so call this immediately before the request that needs one.
export const getTurnstileToken = async (container: HTMLElement, action: string): Promise<string> => {
  const turnstile = await loadTurnstile()
  return new Promise<string>((resolve, reject) => {
    const widgetId = turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      execution: 'execute',
      appearance: 'interaction-only',
      callback: token => {
        turnstile.remove(widgetId)
        resolve(token)
      },
      'error-callback': code => {
        turnstile.remove(widgetId)
        reject(new Error(`Turnstile error${code ? `: ${code}` : ''}`))
      },
    })
    turnstile.execute(container)
  })
}
