// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useRecipientAddress } from './useRecipientAddress'

vi.mock('wagmi', () => ({ usePublicClient: () => undefined }))
vi.mock('bitcoinjs-lib', () => {
  throw new Error('Failed to fetch dynamically imported module')
})
vi.mock('@solana/web3.js', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

let root: ReturnType<typeof createRoot>
let client: QueryClient
let result: ReturnType<typeof useRecipientAddress>
const Harness = ({ value, networkName }: { value: string; networkName: string }) => {
  result = useRecipientAddress(value, { mode: 'nonEvm', networkName })
  return null
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  root = createRoot(document.createElement('div'))
  onlineManager.setOnline(false)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  onlineManager.setOnline(true)
  vi.unstubAllGlobals()
})

it.each([
  ['Bitcoin', 'bc1p5egaltnsssj57zr6k47mk4qmmv4fjsjnjhysge2gcsjl2n9rdntqcmvekz'],
  ['Solana', '11111111111111111111111111111111'],
  ['Bitcoin', 'provider-must-validate-this'],
  ['Solana', 'provider-must-validate-this'],
  ['Bitcoin', ''],
  ['Solana', ''],
])(
  'defers %s validation to the provider on load failure, but still requires a recipient: %s',
  async (networkName, value) => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Harness value={value} networkName={networkName} />
        </QueryClientProvider>,
      )
    })
    await act(async () => {
      await vi.waitFor(() => expect(result.loading).toBe(false))
    })
    expect(result.address).toBe(value || undefined)
    expect(result.error).toBe(false)
    expect(result.message).toBe(value ? undefined : 'Enter a recipient')
  },
)
