// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { RecipientInput } from './RecipientInput'
import { useEvmRecipient } from './hooks/useEvmRecipient'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let state: ReturnType<typeof useEvmRecipient>
const Harness = () => {
  state = useEvmRecipient('connected-wallet')
  return (
    <RecipientInput
      mode="evm"
      value={state.recipient}
      expanded={state.expanded}
      onChange={state.setRecipient}
      onToggle={state.toggleExpanded}
      onUseMyWallet={state.canUseMyWallet ? state.useMyWallet : undefined}
    />
  )
}
const click = async (label: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    item => item.textContent === label || item.getAttribute('aria-label') === label,
  )
  expect(button).toBeDefined()
  await act(async () => button?.click())
}
beforeEach(() => {
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

it('clears explicitly, preserves custom recipient on collapse, and restores the EVM wallet only on request', async () => {
  await act(async () =>
    root.render(
      <I18nProvider i18n={i18n}>
        <Harness />
      </I18nProvider>,
    ),
  )
  await click('Recipient (EVM address)')
  expect(container.querySelector('input')?.value).toBe('connected-wallet')
  await click('Clear address')
  expect(state.recipient).toBe('')
  expect(container.textContent).toContain('Use my wallet')
  await act(async () => state.setRecipient('custom-wallet'))
  await click('Recipient (EVM address)')
  expect(container.querySelector('input')?.disabled).toBe(true)
  expect(state.recipient).toBe('custom-wallet')
  await click('Recipient (EVM address)')
  await click('Use my wallet')
  expect(container.querySelector('input')?.value).toBe('connected-wallet')
  expect(container.textContent).not.toContain('Use my wallet')
})

it('uses the non-EVM label and delegates clear without offering the EVM wallet', async () => {
  const onChange = vi.fn()
  await act(async () =>
    root.render(
      <I18nProvider i18n={i18n}>
        <RecipientInput
          mode="nonEvm"
          networkName="NEAR"
          value="receiver.near"
          expanded
          onChange={onChange}
          onToggle={vi.fn()}
        />
      </I18nProvider>,
    ),
  )
  expect(container.textContent).toContain('Send to other wallet')
  expect(container.textContent).not.toContain('Use my wallet')
  await click('Clear address')
  expect(onChange).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledWith('')
})
