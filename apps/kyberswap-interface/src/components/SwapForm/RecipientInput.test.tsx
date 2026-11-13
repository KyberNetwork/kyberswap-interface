// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { RecipientAddressInput } from './RecipientInput'
import { RecipientAddressType, useEvmRecipient } from './hooks/useEvmRecipient'

vi.mock('components/AddressInputPanel', () => ({
  AddressInput: ({ value, onChange }: any) => <input value={value} onInput={onChange} />,
}))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: () => null }))
vi.mock('components/Collapse', () => ({ Collapse: () => null }))
vi.mock('components/Stack', () => ({ Stack: () => null }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let recipient: ReturnType<typeof useEvmRecipient>
const Harness = ({ type }: { type: RecipientAddressType }) => {
  recipient = useEvmRecipient()
  const [nonEvmValue, setNonEvmValue] = useState('')
  return (
    <RecipientAddressInput
      {...type}
      value={type.mode === 'evm' ? recipient.inputValue : nonEvmValue}
      onChange={type.mode === 'evm' ? recipient.setRecipient : setNonEvmValue}
    />
  )
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it.each([
  ['0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', '0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d'],
  ['0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
  ['0xA2DFEB674D997B68EC5ADB0A6FB9136BD45C2D2D', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
  ['a2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', '0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
  ['0xa2dfeb674d997b68ec5adB0A6fb9136BD45C2D2d', '0xa2dfeb674d997b68ec5adB0A6fb9136BD45C2D2d'],
  ['alice.eth', 'alice.eth'],
  ['0xa2df', '0xa2df'],
  ['0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
])('keeps the input and EVM recipient synchronized for %s', async (value, expected) => {
  await act(async () => {
    root.render(
      <I18nProvider i18n={i18n}>
        <Harness type={{ mode: 'evm' }} />
      </I18nProvider>,
    )
  })
  const input = container.querySelector('input')
  if (!input) throw new Error('Recipient input missing')
  await act(async () => {
    input.value = ` ${value}\n`
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(input.value).toBe(expected)
  expect(recipient.recipient).toBe(expected)
})

it('does not checksum a non-EVM recipient that also looks like EVM hex', async () => {
  await act(async () => {
    root.render(
      <I18nProvider i18n={i18n}>
        <Harness type={{ mode: 'nonEvm', networkName: 'NEAR' }} />
      </I18nProvider>,
    )
  })
  const value = 'a2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d'
  const input = container.querySelector('input')
  if (!input) throw new Error('Recipient input missing')
  await act(async () => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(input.value).toBe(value)
})
