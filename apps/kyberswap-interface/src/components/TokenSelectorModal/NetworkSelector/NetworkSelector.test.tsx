// @vitest-environment happy-dom
import { ChainId } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { ChainSelector } from './ChainSelector'
import { NetworkSidebar } from './NetworkSidebar'

vi.mock('components/ScrollableWithSignal', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
i18n.loadAndActivate({ locale: 'en', messages: {} })
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const chains = [{ chainId: ChainId.MAINNET, name: 'Ethereum', icon: 'eth.svg' }]
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const render = async (children: ReactNode) => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<I18nProvider i18n={i18n}>{children}</I18nProvider>))
}
afterEach(async () => {
  await act(async () => root?.unmount())
  container?.remove()
})

it('selects All Networks from the desktop list', async () => {
  const change = vi.fn()
  await render(<NetworkSidebar chains={chains} selectedChainId="all" onChange={change} />)
  const option = container.querySelector('button')
  if (!option) throw new Error('Network option missing')
  expect(option.textContent).toBe('All Networks')
  expect(option.getAttribute('aria-pressed')).toBe('true')
  await act(async () => option.click())
  expect(change).toHaveBeenCalledWith('all')
})

it('puts All Networks first in the mobile dropdown and supports keyboard selection', async () => {
  const change = vi.fn()
  await render(<ChainSelector chains={chains} selectedChainId={ChainId.MAINNET} onChange={change} />)
  await act(async () => container.querySelector('button')?.click())
  const option = container.querySelector<HTMLElement>('[role="option"]')
  if (!option) throw new Error('Network option missing')
  expect(option.textContent).toBe('All Networks')
  await act(async () => option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
  expect(change).toHaveBeenCalledWith('all')
  expect(container.querySelector('[role="listbox"]')).toBeNull()
})

it('preserves the restricted network list for oracle selectors', async () => {
  await render(<NetworkSidebar chains={chains} selectedChainId={ChainId.MAINNET} showAllNetworks={false} />)
  expect(container.textContent).not.toContain('All Networks')
  expect(container.querySelector('button')?.textContent).toBe('Ethereum')
})
