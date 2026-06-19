import mixpanel from 'mixpanel-browser'

import { MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN, MIXPANEL_PROJECT_TOKEN } from 'constants/env'

let initialized = false
let crossChainMixpanel: typeof mixpanel | null = null

export function initMixpanel() {
  if (initialized) return

  // Default instance
  mixpanel.init(MIXPANEL_PROJECT_TOKEN, { debug: false })

  // Optional secondary instance
  if (MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN) {
    const SECONDARY_NAME = 'cross_chain'
    mixpanel.init(MIXPANEL_CROSS_CHAIN_PROJECT_TOKEN, { debug: false }, SECONDARY_NAME)
    crossChainMixpanel = (mixpanel as unknown as Record<string, typeof mixpanel>)[SECONDARY_NAME] ?? null
  }

  initialized = true
}

export { crossChainMixpanel }

export default mixpanel
