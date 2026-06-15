import type Mixpanel from 'mixpanel-browser'

import { MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN, MIXPANEL_PROJECT_TOKEN } from 'constants/env'

// `mixpanel-browser` (~98KB) is heavy and never needed for first paint, so it is DYNAMICALLY imported
// inside `initMixpanel`. Until that import resolves, the default export and `crossChainMixpanel` below are
// lightweight queueing proxies: any `track`/`identify`/`people.set`/… call made before the SDK finishes
// loading is buffered and replayed in order once the real instances exist, so no early events are lost.

type MixpanelInstance = typeof Mixpanel

// A queued call is replayed against the resolved instance via a method path (e.g. ['people', 'set']).
type QueuedCall = { path: string[]; args: unknown[] }

/**
 * Lightweight stand-in for a mixpanel instance. Records calls until `flush(real)` hands it the real
 * instance, after which it replays the buffer in order and forwards every subsequent call straight
 * through. Method-path aware so nested namespaces (`people.set`, `people.set_once`) queue correctly.
 */
class MixpanelQueue {
  private real: MixpanelInstance | null = null
  private queue: QueuedCall[] = []
  private disabled = false

  /** Proxy that captures `instance.<method>(...)` and `instance.people.<method>(...)` calls. */
  readonly proxy: MixpanelInstance

  constructor() {
    this.proxy = this.makeProxy([])
  }

  private makeProxy(path: string[]): MixpanelInstance {
    // Each access returns either a callable (leaf method) or another namespace proxy (e.g. `people`).
    const target = (...args: unknown[]) => this.invoke(path, args)
    return new Proxy(target, {
      get: (_t, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined
        // `hasOwnProperty('get_distinct_id')` is used as a React memo dep to detect readiness: before the
        // SDK loads we are not ready (false); afterwards we delegate to the real instance.
        if (prop === 'hasOwnProperty') {
          return (key: string) => (this.real ? Object.prototype.hasOwnProperty.call(this.real, key) : false)
        }
        return this.makeProxy([...path, prop])
      },
    }) as unknown as MixpanelInstance
  }

  private invoke(path: string[], args: unknown[]) {
    if (this.real) {
      return this.resolvePath(this.real, path)?.(...args)
    }
    // Mirror the old `crossChainMixpanel == null` path: when permanently disabled, drop calls instead of
    // buffering them forever (the queue would never flush).
    if (this.disabled) return undefined
    this.queue.push({ path, args })
    return undefined
  }

  // Walk a method path (e.g. ['people', 'set']) on the real instance, returning a bound callable.
  private resolvePath(root: MixpanelInstance, path: string[]): ((...args: unknown[]) => unknown) | undefined {
    // `any`: dynamic property-path traversal over the mixpanel instance's nested namespaces — the path is
    // built from the captured proxy access, so there is no statically-known key type here.
    let ctx: any = root
    for (let i = 0; i < path.length - 1; i++) {
      ctx = ctx?.[path[i]]
      if (!ctx) return undefined
    }
    const fn = ctx?.[path[path.length - 1]]
    return typeof fn === 'function' ? fn.bind(ctx) : undefined
  }

  /** Attach the real instance and replay every buffered call in order. */
  flush(real: MixpanelInstance) {
    this.real = real
    const pending = this.queue
    this.queue = []
    for (const { path, args } of pending) {
      this.resolvePath(real, path)?.(...args)
    }
  }

  /** Permanently drop calls (no real instance is coming) and release any buffered ones. */
  disable() {
    this.disabled = true
    this.queue = []
  }
}

const defaultQueue = new MixpanelQueue()
const crossChainQueue = new MixpanelQueue()

let initialized = false

// The default export and `crossChainMixpanel` keep the SAME shape callers used before (track/identify/
// people.set/register/reset/hasOwnProperty), now backed by the queueing proxies.
const mixpanelProxy = defaultQueue.proxy
const crossChainMixpanel: MixpanelInstance | null = crossChainQueue.proxy

export async function initMixpanel() {
  if (initialized) return
  initialized = true

  const { default: mixpanel } = await import('mixpanel-browser')

  // Default instance
  mixpanel.init(MIXPANEL_PROJECT_TOKEN, { debug: false })
  defaultQueue.flush(mixpanel)

  // Optional secondary instance
  if (MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN) {
    const SECONDARY_NAME = 'cross_chain'
    mixpanel.init(MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN, { debug: false }, SECONDARY_NAME)
    const secondary = (mixpanel as unknown as Record<string, MixpanelInstance>)[SECONDARY_NAME]
    if (secondary) crossChainQueue.flush(secondary)
    else crossChainQueue.disable()
  } else {
    // No secondary token: cross-chain tracking is off, matching the old `crossChainMixpanel = null`.
    crossChainQueue.disable()
  }
}

export { crossChainMixpanel }

export default mixpanelProxy
