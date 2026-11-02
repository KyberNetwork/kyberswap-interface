// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { CrossChainReceiverWalletModal } from 'components/SwapForm/CrossChain/CrossChainReceiverWalletModal'
import { NonEvmChain } from 'types/crossChain'

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  onSelect: vi.fn(),
  onDismiss: vi.fn(),
  loading: false,
  accepted: true,
}))
vi.mock('components/SwapForm/CrossChain/hooks/useReceiverWalletOptions', () => ({
  useReceiverWalletOptions: () => ({
    wallets: [{ id: 'wallet', name: 'Receiver Wallet', icon: '/wallet.svg', installed: true, connect: mocks.connect }],
    loading: mocks.loading,
  }),
}))
vi.mock('hooks/useTheme', () => ({ default: () => ({}) }))
vi.mock('state/user/hooks', () => ({ useIsAcceptedTerm: () => [mocks.accepted, vi.fn()] }))
vi.mock('components/Web3Provider/BitcoinProvider/providers/ledger', () => ({ DerivationPaths: {} }))
vi.mock('components/Modal', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const wallet = { id: 'wallet', name: 'Receiver Wallet', icon: '/wallet.svg', address: 'receiver-address' }
const render = (chain = NonEvmChain.Near) =>
  act(async () =>
    root.render(
      <I18nProvider i18n={i18n}>
        <CrossChainReceiverWalletModal
          key={chain}
          chain={chain}
          onSelect={mocks.onSelect}
          onDismiss={mocks.onDismiss}
        />
      </I18nProvider>,
    ),
  )
const click = async (label: string) =>
  act(async () => {
    const button = Array.from(container.querySelectorAll('button')).find(
      element => element.textContent?.includes(label) || element.getAttribute('aria-label') === label,
    )
    if (!button) throw new Error(`Missing button ${label}`)
    button.click()
  })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.loading = false
  mocks.accepted = true
  dayjs.extend(utc)
  i18n.load('en', {})
  i18n.activate('en')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('commits and dismisses once after a successful receiver connection', async () => {
  mocks.connect.mockResolvedValue([wallet])
  await render()
  await click('Receiver Wallet')
  expect(mocks.onSelect).toHaveBeenCalledWith(wallet)
  expect(mocks.onDismiss).toHaveBeenCalledOnce()
})

it.each(['close', 'chain', 'unmount'])(
  'ignores a late wallet result after %s and blocks repeated clicks',
  async action => {
    let resolve: (value: (typeof wallet)[]) => void = () => {
      throw new Error('Request not started')
    }
    mocks.connect.mockImplementation(
      () =>
        new Promise(done => {
          resolve = done
        }),
    )
    await render()
    await click('Receiver Wallet')
    await click('Receiver Wallet')
    expect(mocks.connect).toHaveBeenCalledOnce()
    if (action === 'close') await click('Close')
    else if (action === 'chain') await render(NonEvmChain.Solana)
    else await act(async () => root.render(null))
    await act(async () => resolve([wallet]))
    expect(mocks.onSelect).not.toHaveBeenCalled()
    expect(mocks.onDismiss).toHaveBeenCalledTimes(action === 'close' ? 1 : 0)
  },
)

it('keeps failure local and allows retry without committing an empty or stale receiver', async () => {
  mocks.connect.mockRejectedValueOnce(new Error('User rejected')).mockResolvedValueOnce([wallet])
  await render()
  await click('Receiver Wallet')
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('User rejected')
  expect(mocks.onSelect).not.toHaveBeenCalled()
  expect(mocks.onDismiss).not.toHaveBeenCalled()
  await click('Receiver Wallet')
  expect(mocks.onSelect).toHaveBeenCalledWith(wallet)
})

it('commits the explicitly selected account when a wallet returns multiple accounts', async () => {
  mocks.connect.mockResolvedValue([wallet, { ...wallet, address: 'second-address' }])
  await render()
  await click('Receiver Wallet')
  expect(mocks.onSelect).not.toHaveBeenCalled()
  await click('second-address')
  expect(mocks.onSelect).toHaveBeenCalledWith({ ...wallet, address: 'second-address' })
  expect(mocks.onDismiss).toHaveBeenCalledOnce()
})

it('only enables wallet selection after loading and accepting terms', async () => {
  mocks.loading = true
  mocks.accepted = false
  await render()
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  expect(container.textContent).not.toContain('Receiver Wallet')

  mocks.loading = false
  await render()
  await click('Receiver Wallet')
  expect(mocks.connect).not.toHaveBeenCalled()

  mocks.accepted = true
  mocks.connect.mockResolvedValue([wallet])
  await render()
  await click('Receiver Wallet')
  expect(mocks.connect).toHaveBeenCalledOnce()
  expect(mocks.onSelect).toHaveBeenCalledWith(wallet)
  expect(mocks.onDismiss).toHaveBeenCalledOnce()
})
