import type { Chain } from 'services/copyTrading/types/agents'
import { describe, expect, it } from 'vitest'

import { getSidebarRouteState } from './components/Sidebar/primitives'
import { getCopyTradingPath, resolveCopyTradingRoute } from './routing'

const chains: Chain[] = [
  { chainId: 1, slug: 'ethereum', name: 'Ethereum', iconUrl: '', isEnabled: true },
  { chainId: 8453, slug: 'base', name: 'Base', iconUrl: '', isEnabled: true },
]

describe('Copy Trading URLs', () => {
  it.each(['', 'my-copies', 'history'])('keeps the chain on list route %s', path => {
    expect(getCopyTradingPath('base', path)).toBe(`/copy-trading/base${path ? '/' + path : ''}`)
    expect(resolveCopyTradingRoute(getCopyTradingPath('base', path), chains)).toEqual({
      chain: chains[1],
      redirect: undefined,
    })
  })

  it.each(['agent-1', 'my-copies/run-1', 'history/run-2'])('omits the chain on detail route %s', path => {
    expect(getCopyTradingPath('base', path)).toBe(`/copy-trading/${path}`)
    expect(getCopyTradingPath('all', path)).toBe(`/copy-trading/${path}`)
    expect(resolveCopyTradingRoute(`/copy-trading/${path}`, chains)).toEqual({ isDetail: true })
    expect(resolveCopyTradingRoute(`/copy-trading/${path}`, [])).toEqual({ isDetail: true })
  })

  it.each(['base', '8453', 'all'])('redirects old detail URLs with chain %s', chain => {
    for (const path of ['agent-1', 'my-copies/run-1', 'history/run-2']) {
      expect(resolveCopyTradingRoute(`/copy-trading/${chain}/${path}`, chains).redirect).toBe(`/copy-trading/${path}`)
    }
  })

  it('canonicalizes a numeric chain on list pages', () => {
    expect(resolveCopyTradingRoute('/copy-trading/8453/history', chains).redirect).toBe('/copy-trading/base/history')
  })

  it('does not select another network while discovery is loading', () => {
    expect(resolveCopyTradingRoute('/copy-trading/base/my-copies', []).chain).toBeUndefined()
  })

  it('keeps the selected chain when the catalog order or enabled status changes', () => {
    const updated = [{ ...chains[1], isEnabled: false }, chains[0]]
    expect(resolveCopyTradingRoute('/copy-trading/base', updated).chain?.chainId).toBe(8453)
  })

  it.each(['/copy-trading', '/copy-trading/', '/copy-trading/all', '/copy-trading/all/history'])(
    'resolves %s with all chains',
    pathname => {
      expect(resolveCopyTradingRoute(pathname, chains)).toEqual({ allChains: true })
    },
  )

  it('rejects an unknown chain prefix on a nested URL', () => {
    expect(resolveCopyTradingRoute('/copy-trading/unknown/history/run-2', chains)).toEqual({ isDetail: false })
  })
})

describe('sidebar route selection', () => {
  it('selects the agent on a chainless profile URL', () => {
    expect(getSidebarRouteState('/copy-trading/agent-1', '/copy-trading/all')).toMatchObject({
      activeAgentCode: 'agent-1',
      isAgentProfilePage: true,
      isAgentsPage: true,
      activeCopyId: '',
    })
  })

  it.each(['my-copies', 'history'])('selects the copy on chainless %s details', section => {
    expect(getSidebarRouteState(`/copy-trading/${section}/run-1/`, '/copy-trading/all')).toMatchObject({
      activeCopyId: 'run-1',
      isAgentProfilePage: false,
      isMyCopiesSectionActive: true,
      isHistorySectionActive: section === 'history',
      isCopiesPage: section === 'my-copies',
    })
  })

  it.each(['base', 'all'])('does not mistake the %s leaderboard for an agent', chain => {
    expect(getSidebarRouteState(`/copy-trading/${chain}`, `/copy-trading/${chain}`)).toMatchObject({
      activeAgentCode: '',
      isAgentProfilePage: false,
      isAgentsPage: true,
    })
  })
})
