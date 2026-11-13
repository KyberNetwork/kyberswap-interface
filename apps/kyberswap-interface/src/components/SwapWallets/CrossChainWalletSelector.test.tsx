// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CrossChainWalletSelector } from 'components/SwapWallets/CrossChainWalletSelector'
import { Chain, NonEvmChain } from 'types/crossChain'

const mocks = vi.hoisted(() => ({
  nearAddress: null as string | null,
  onRecipientChange: vi.fn(),
  onRecipientApply: vi.fn(),
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
  readText: vi.fn(),
}))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const render = (recipient = '', chain: Chain = NonEvmChain.Near, isPastedRecipient = false, pastedRecipient = '') =>
  act(async () => {
    root.render(
      <I18nProvider i18n={i18n}>
        <CrossChainWalletSelector
          role="receiver"
          chain={chain}
          wallet={
            mocks.nearAddress
              ? { id: 'near', address: mocks.nearAddress, name: 'NEAR Wallet', icon: '/near-wallet.png' }
              : undefined
          }
          recipient={recipient}
          pastedRecipient={pastedRecipient}
          isPastedRecipient={isPastedRecipient}
          onSelectWallet={mocks.onRecipientChange}
          onApply={mocks.onRecipientApply}
          onConnect={mocks.onConnect}
          onDisconnect={mocks.onDisconnect}
        />
      </I18nProvider>,
    )
  })
const button = (label: string) => {
  const result = Array.from(container.querySelectorAll('button')).find(
    item => item.textContent === label || item.getAttribute('aria-label') === label,
  )
  if (!result) throw new Error(`Button not found: ${label}`)
  return result
}
const click = (element: HTMLElement) => act(async () => element.click())

beforeEach(() => {
  vi.clearAllMocks()
  i18n.load('en', {})
  i18n.activate('en')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.nearAddress = null
  vi.spyOn(navigator.clipboard, 'readText').mockImplementation(mocks.readText)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('receiver wallet selector', () => {
  it.each([
    [1, '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d'],
    [1, '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
    [1, '0xA2DFEB674D997B68EC5ADB0A6FB9136BD45C2D2D', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
    [1, 'a2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
    [1, 'alice.eth', 'alice.eth'],
    [1, '0xa2dfeb674d997b68ec5adB0A6fb9136BD45C2D2d', '0xa2dfeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
    [NonEvmChain.Near, 'a2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', 'a2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d'],
  ] as const)('normalizes only valid EVM clipboard input on chain %s: %s', async (chain, value, expected) => {
    mocks.readText.mockResolvedValue(` ${value}\n`)
    await render('', chain)
    await click(button('Select Wallet'))
    await click(button('Paste recipient address'))
    expect(container.querySelector('input')?.value).toBe(expected)
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
    await click(button('Apply'))
    expect(mocks.onRecipientApply).toHaveBeenCalledWith(expected)
  })

  it('disconnects only the receiver selection without changing the pasted address or selecting another wallet', async () => {
    mocks.nearAddress = 'connected.near'
    await render('pasted.near', NonEvmChain.Near, true, 'pasted.near')
    await click(button('pasted.near'))
    await click(button('Disconnect wallet'))
    expect(mocks.onDisconnect).toHaveBeenCalledOnce()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
  })

  it('ignores a clipboard read that finishes after the menu is dismissed and reopened', async () => {
    let resolve: (value: string) => void = () => {
      throw new Error('Paste not started')
    }
    mocks.readText.mockImplementation(
      () =>
        new Promise(done => {
          resolve = done
        }),
    )
    await render('saved.near', NonEvmChain.Near, true, 'saved.near')
    await click(button('saved.near'))
    await click(button('Paste recipient address'))
    await click(button('saved.near'))
    await click(button('saved.near'))
    await act(async () => resolve('late.near'))
    expect(container.querySelector('input')?.value).toBe('saved.near')
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
  })

  it('keeps the paste input separate from the restored wallet address', async () => {
    mocks.nearAddress = 'connected.near'
    await render('connected.near')
    await click(button('connected.near'))
    expect(container.querySelector('input')?.value).toBe('')
    expect(container.textContent).not.toContain('Apply')

    await click(button('connected.near'))
    await render('connected.near', NonEvmChain.Near, false, 'pasted.near')
    await click(button('connected.near'))
    expect(container.querySelector('input')?.value).toBe('pasted.near')
  })

  it('pastes without a connected wallet and commits the cleaned address only on Apply', async () => {
    mocks.readText.mockResolvedValue('  receiver.near\n')
    await render()
    await click(button('Select Wallet'))
    await click(button('Paste recipient address'))

    expect(container.querySelector('input')?.value).toBe('receiver.near')
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
    await click(button('Clear address'))
    expect(container.querySelector('input')?.value).toBe('')
    expect(container.textContent).not.toContain('Apply')
    await click(button('Paste recipient address'))
    await click(button('Apply'))
    expect(mocks.onRecipientApply.mock.calls).toEqual([['receiver.near']])
  })

  it('discards an unapplied paste on dismissal and restores the current recipient when reopened', async () => {
    mocks.readText.mockResolvedValue('different.near')
    await render('current.near', NonEvmChain.Near, true, 'current.near')
    await click(button('current.near'))
    await click(button('Paste recipient address'))
    await act(async () => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    await click(button('current.near'))

    expect(container.querySelector('input')?.value).toBe('current.near')
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
  })

  it('allows selecting the connected wallet instead of a custom recipient', async () => {
    mocks.nearAddress = 'connected.near'
    await render('custom.near')
    await click(button('custom.near'))
    await click(button('connected.near'))
    expect(mocks.onRecipientChange).toHaveBeenCalledOnce()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
  })

  it('keeps manual entry available when clipboard access fails and prevents an empty Apply', async () => {
    mocks.readText.mockRejectedValue(new Error('Clipboard permission denied'))
    await render()
    await click(button('Select Wallet'))
    await click(button('Paste recipient address'))

    expect(document.activeElement).toBe(container.querySelector('input'))
    expect(container.textContent).not.toContain('Apply')
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
  })
})
