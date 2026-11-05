// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { type ButtonHTMLAttributes, type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { GasDropOption } from 'components/SwapForm/CrossChain/Quote/GasDrop'

vi.mock('pages/Swap/crossChain/hooks/useGasDropValue', () => ({
  useGasDropValue: () => ({ symbol: 'ETH', amountUsd: 2 }),
}))
vi.mock('pages/Swap/crossChain/utils', () => ({ getChainName: () => 'Base' }))
vi.mock('components/Modal', () => ({
  default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}))
vi.mock('components/Tooltip', () => ({
  MouseoverTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('components/Button', () => ({
  ButtonOutlined: (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  ButtonPrimary: (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}))

let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const onChange = vi.fn()
const render = async (provider = 'Relay', enabled = false) => {
  await act(async () =>
    root.render(
      <I18nProvider i18n={i18n}>
        <GasDropOption chain={8453} provider={provider} outputSymbol="USDC" enabled={enabled} onChange={onChange} />
      </I18nProvider>,
    ),
  )
}
const click = async (label: string) => {
  const button = Array.from(container.querySelectorAll('button, [role="button"]')).find(
    item => item.textContent === label || item.getAttribute('aria-label') === label,
  )
  expect(button).toBeDefined()
  await act(async () => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}
beforeEach(() => {
  i18n.load('en', {})
  i18n.activate('en')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  onChange.mockReset()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('keeps the current route on cancel or close and only adds gas on confirmation', async () => {
  await render()
  await click('+ Gas')
  expect(onChange).not.toHaveBeenCalled()
  await click('Cancel')
  await click('+ Gas')
  await click('Close')
  expect(onChange).not.toHaveBeenCalled()
  await click('+ Gas')
  await click('Switch & Add Gas')
  expect(onChange.mock.calls).toEqual([[true]])
})

it('adds gas directly on KyberCross and removes it without confirmation', async () => {
  await render('KyberCross')
  await click('+ Gas')
  expect(onChange.mock.calls).toEqual([[true]])
  await render('KyberCross', true)
  await click('Remove Gas Drop')
  expect(onChange.mock.calls).toEqual([[true], [false]])
})
