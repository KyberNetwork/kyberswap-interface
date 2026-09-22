import type { Chain } from 'services/copyTrading/types/agents'
import { describe, expect, it } from 'vitest'

import { getCopyTradingPath, resolveCopyTradingRoute } from './routing'

const chains: Chain[] = [
  { chainId: 1, slug: 'ethereum', name: 'Ethereum', iconUrl: '', isEnabled: true },
  { chainId: 8453, slug: 'base', name: 'Base', iconUrl: '', isEnabled: true },
]

describe('Copy Trading chain URLs', () => {
  it.each(['', 'my-copies', 'history', 'agent-1', 'my-copies/run-1', 'history/run-2'])(
    'restores Base from a shared %s URL',
    path => {
      const pathname = getCopyTradingPath('base', path)
      expect(resolveCopyTradingRoute(pathname, chains)).toEqual({ chain: chains[1], redirect: undefined })
    },
  )

  it('does not fall back to another network while discovery is loading', () => {
    expect(resolveCopyTradingRoute('/copy-trading/base/my-copies', []).chain).toBeUndefined()
    expect(resolveCopyTradingRoute('/copy-trading', []).redirect).toBeUndefined()
  })

  it('keeps the URL-selected chain when the catalog order or enabled status changes', () => {
    const updated = [{ ...chains[1], isEnabled: false }, chains[0]]
    expect(resolveCopyTradingRoute('/copy-trading/base', updated).chain?.chainId).toBe(8453)
  })

  it('uses an enabled default only when the URL has no chain', () => {
    expect(resolveCopyTradingRoute('/copy-trading', [{ ...chains[0], isEnabled: false }, chains[1]]).redirect).toBe(
      '/copy-trading/base',
    )
    expect(resolveCopyTradingRoute('/copy-trading/my-copies/run-1', chains).redirect).toBe(
      '/copy-trading/ethereum/my-copies/run-1',
    )
  })

  it('preserves legacy agent links for chain canonicalization by Agent Profile', () => {
    expect(resolveCopyTradingRoute('/copy-trading/agent-1', chains).redirect).toBe('/copy-trading/ethereum/agent-1')
  })

  it('canonicalizes numeric chain URLs without losing the detail path', () => {
    expect(resolveCopyTradingRoute('/copy-trading/8453/history/run-2', chains).redirect).toBe(
      '/copy-trading/base/history/run-2',
    )
  })

  it('does not silently replace an unknown chain in a detail URL', () => {
    expect(resolveCopyTradingRoute('/copy-trading/unknown/history/run-2', chains).redirect).toBeUndefined()
  })
})
