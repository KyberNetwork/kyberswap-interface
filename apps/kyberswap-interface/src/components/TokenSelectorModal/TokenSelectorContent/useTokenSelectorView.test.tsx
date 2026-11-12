// @vitest-environment happy-dom
import { ChainId } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'

import { useTokenSelectorView } from './useTokenSelectorView'

vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: 'wallet' }) }))
vi.mock('hooks/useChainsConfig', () => ({ default: () => ({ supportedChains: [] }) }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: () => undefined }), TRACKING_EVENT_TYPE: {} }))
vi.mock('hooks/useDebounce', () => ({ default: (value: string) => value }))
vi.mock('components/TokenSelectorModal/NetworkSelector/useChainsVolume', () => ({ useChainsVolume: () => ({}) }))
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
let view: ReturnType<typeof useTokenSelectorView>
const mount = async () => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  function Probe() {
    view = useTokenSelectorView({ anchorChainId: ChainId.MAINNET, showDiscoveryTabs: true })
    return null
  }
  await act(async () => root.render(<Probe />))
}
afterEach(async () => {
  await act(async () => root?.unmount())
  container?.remove()
})
it('keeps discovery tabs available when switching to All Networks', async () => {
  await mount()
  await act(async () => view.handleTabChange(TokenSelectorTab.Trending))
  expect(view.activeTab).toBe(TokenSelectorTab.Trending)
  await act(async () => view.handleChainChange('all'))
  expect(view.visibleTabs).toEqual(Object.values(TokenSelectorTab))
  expect(view.activeTab).toBe(TokenSelectorTab.Trending)
  await act(async () => view.handleChainChange(ChainId.BASE))
  expect(view.visibleTabs).toContain(TokenSelectorTab.Trending)
  expect(view.visibleTabs).toContain(TokenSelectorTab.Imported)
  expect(view.visibleTabs).toContain(TokenSelectorTab.Favorites)
})
it('restores the discovery tab after clearing an All Networks search', async () => {
  await mount()
  await act(async () => view.handleTabChange(TokenSelectorTab.New))
  await act(async () => view.setSearchQuery('USDC'))
  await act(async () => view.handleChainChange('all'))
  await act(async () => view.setSearchQuery(''))
  expect(view.activeTab).toBe(TokenSelectorTab.New)
  expect(view.visibleTabs).toEqual(Object.values(TokenSelectorTab))
})
