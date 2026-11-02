// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CrossChainWalletSelector } from 'components/SwapForm/CrossChain/CrossChainWalletSelector'
import { NonEvmChain } from 'pages/Swap/crossChain/adapters/types'

const mocks = vi.hoisted(() => ({
  nearAddress: null as string | null,
  onOpenWallet: vi.fn(),
  signOut: vi.fn(),
  setIsOpen: vi.fn(),
  onRecipientChange: vi.fn(),
  onRecipientApply: vi.fn(),
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
  readText: vi.fn(),
}))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const render = (recipient = '', chain = NonEvmChain.Near, isPastedRecipient = false, pastedRecipient = '') =>
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

describe('non-EVM receiver wallet selector', () => {
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
    await click(button('Paste receiver address'))
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
    await click(button('Paste receiver address'))

    expect(container.querySelector('input')?.value).toBe('receiver.near')
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
    await click(button('Clear address'))
    expect(container.querySelector('input')?.value).toBe('')
    expect(container.querySelector('[aria-label="Clear address"]')).toBeNull()
    expect(container.textContent).not.toContain('Apply')
    await click(button('Paste receiver address'))
    await click(button('Apply'))
    expect(mocks.onRecipientApply).toHaveBeenCalledWith('receiver.near')
    expect(container.querySelector('[data-wallet-menu]')).toBeNull()
  })

  it('discards an unapplied paste on dismissal and restores the current recipient when reopened', async () => {
    mocks.readText.mockResolvedValue('different.near')
    await render('current.near', NonEvmChain.Near, true, 'current.near')
    await click(button('current.near'))
    await click(button('Paste receiver address'))
    await act(async () => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))
    await click(button('current.near'))

    expect(container.querySelector('input')?.value).toBe('current.near')
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
  })

  it('allows selecting the connected wallet instead of a custom recipient', async () => {
    mocks.nearAddress = 'connected.near'
    await render('custom.near')
    await click(button('custom.near'))
    expect(container.querySelector('[data-wallet-menu] img')?.getAttribute('src')).toBe('/near-wallet.png')
    await click(button('connected.near'))
    expect(mocks.onRecipientChange).toHaveBeenCalledOnce()
    expect(mocks.onRecipientApply).not.toHaveBeenCalled()
  })

  it('shows the paste icon after Apply even for the connected address, then restores the wallet logo on selection', async () => {
    mocks.nearAddress = 'connected.near'
    mocks.readText.mockResolvedValue('connected.near')
    await render('connected.near')
    await click(button('connected.near'))
    await click(button('Paste receiver address'))
    await click(button('Apply'))
    await render('connected.near', NonEvmChain.Near, true)
    expect(container.querySelector('button [aria-label="Pasted receiver address"]')).not.toBeNull()
    expect(container.querySelector('button img')).toBeNull()

    await click(button('connected.near'))
    const connectedWallet = container.querySelector('[data-wallet-menu] button') as HTMLButtonElement
    await click(connectedWallet)
    await render('connected.near', NonEvmChain.Near, false)
    expect(container.querySelector('button [aria-label="Pasted receiver address"]')).toBeNull()
    expect(container.querySelector('button img')?.getAttribute('src')).toBe('/near-wallet.png')
  })

  it.each([NonEvmChain.Near, NonEvmChain.Solana])('opens the destination wallet connector for %s', async chain => {
    await render('', chain)
    await click(button('Select Wallet'))
    await click(button('Connect a wallet'))

    expect(mocks.onConnect).toHaveBeenCalledOnce()
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
  })

  it('keeps manual entry available when clipboard access fails and prevents an empty Apply', async () => {
    mocks.readText.mockRejectedValue(new Error('Clipboard permission denied'))
    await render()
    await click(button('Select Wallet'))
    await click(button('Paste receiver address'))

    expect(document.activeElement).toBe(container.querySelector('input'))
    expect(container.textContent).not.toContain('Apply')
    expect(container.querySelector('[aria-label="Clear address"]')).toBeNull()
    expect(mocks.onRecipientChange).not.toHaveBeenCalled()
  })
})
