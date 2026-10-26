// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { type ComponentProps, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { TokenRow } from 'components/TokenSelectorModal/TokenRow'

vi.mock('components/CurrencyLogo', () => ({ default: () => null }))
vi.mock('components/TokenSelectorModal/PinnedTokens', () => ({ getDisplayTokenInfo: (currency: Token) => currency }))
vi.mock('utils/dmm', () => ({ useCurrencyConvertedToNative: (currency: Token) => currency }))
vi.mock('hooks/useRestrictedTokens', () => ({ restrictedTokenMessage: () => 'Unavailable' }))

const token = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'TOKEN', 'Token')
i18n.loadAndActivate({ locale: 'en', messages: {} })
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: ReturnType<typeof createRoot> | undefined
let container: HTMLDivElement
const render = async (props: Partial<ComponentProps<typeof TokenRow>> = {}) => {
  if (!root) {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  }
  await act(async () =>
    root?.render(
      <I18nProvider i18n={i18n}>
        <TokenRow currency={token} isSelected={false} showFavoriteIcon={false} {...props} />
      </I18nProvider>,
    ),
  )
}
const click = async (selector: string) => {
  const node = container.querySelector<HTMLElement>(selector)
  expect(node).not.toBeNull()
  await act(async () => node?.click())
}
afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  container?.remove()
})

it('keeps selection separate from import and restriction actions, including keyboard activation', async () => {
  const select = vi.fn(),
    importToken = vi.fn(),
    warn = vi.fn()
  await render({ onSelect: select, onImportToken: importToken, rightColumn: 'import' })
  await click('[data-testid="button-import-token"]')
  expect(importToken).toHaveBeenCalledOnce()
  expect(select).not.toHaveBeenCalled()

  await render({
    onSelect: select,
    onImportToken: importToken,
    importOnClick: true,
    restricted: true,
    onRestrictedClick: warn,
  })
  await click('[data-testid="token-item"]')
  expect(warn).toHaveBeenCalledOnce()
  expect(importToken).toHaveBeenCalledOnce()
  expect(select).not.toHaveBeenCalled()

  await render({ onSelect: select })
  const row = container.querySelector<HTMLElement>('[data-testid="token-item"]')
  if (!row) throw new Error('Token row is missing')
  row.focus()
  await act(async () => row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
  expect(select).toHaveBeenCalledOnce()
  expect(select).toHaveBeenCalledWith(token)
  await render({ onSelect: select, priceUsd: 5, showPriceColumn: true })
  expect(container.querySelector('[data-testid="token-item"]')).toBe(row)
  expect(document.activeElement).toBe(row)
})

it('keeps removal button keyboard events and clicks separate from token selection', async () => {
  const select = vi.fn(),
    remove = vi.fn()
  await render({ onSelect: select, onRemoveImportedToken: remove })
  const button = container.querySelector<HTMLButtonElement>('button[data-testid="button-remove-import-token"]')
  if (!button) throw new Error('Remove button is missing')
  expect(button.type).toBe('button')
  expect(button.getAttribute('aria-label')).toBe('Remove imported token')
  button.focus()
  expect(document.activeElement).toBe(button)

  for (const key of ['Enter', ' ']) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    await act(async () => button.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(false)
    expect(select).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  }

  await click('[data-testid="button-remove-import-token"]')
  expect(remove).toHaveBeenCalledOnce()
  expect(remove).toHaveBeenCalledWith(token)
  expect(select).not.toHaveBeenCalled()
})

it('distinguishes zero, unavailable and hidden balances and preserves custom balance output', async () => {
  await render({ balanceUnknown: true })
  expect(container.querySelector('[data-testid="token-balance"]')?.textContent).toBe('--')
  await render({ balanceUnknown: true, currencyBalance: CurrencyAmount.fromRawAmount(token, '0') })
  expect(container.querySelector('[data-testid="token-balance"]')?.textContent).toBe('0')
  await render({ hideBalance: true, usdBalance: 20 })
  expect(container.textContent).toContain('******')
  expect(container.querySelector('[data-testid="token-usd-value"]')).toBeNull()
  await render({ customBalance: <span data-custom>Scaled amount</span>, hideBalance: true })
  expect(container.querySelector('[data-custom]')?.textContent).toBe('Scaled amount')
})
