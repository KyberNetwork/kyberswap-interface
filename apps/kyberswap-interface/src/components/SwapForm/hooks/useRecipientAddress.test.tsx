// @vitest-environment happy-dom
import { i18n } from '@lingui/core'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { RecipientAddressType } from './useEvmRecipient'
import { useRecipientAddress } from './useRecipientAddress'

const mocks = vi.hoisted(() => ({ resolve: vi.fn(), read: vi.fn() }))
vi.mock('wagmi', () => ({ usePublicClient: () => ({ getEnsAddress: mocks.resolve, readContract: mocks.read }) }))
const wallet = '0x0000000000000000000000000000000000000001'
let root: ReturnType<typeof createRoot>
let client: QueryClient
let result: ReturnType<typeof useRecipientAddress>
const Harness = ({ value, type }: { value: string; type: RecipientAddressType }) => {
  result = useRecipientAddress(value, type)
  return null
}
const render = (value: string, type: RecipientAddressType = { mode: 'evm' }) =>
  act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Harness value={value} type={type} />
      </QueryClientProvider>,
    )
  })
const settled = () =>
  act(async () => {
    await vi.waitFor(() => expect(result.loading).toBe(false))
  })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.resetAllMocks()
  i18n.load('en', {})
  i18n.activate('en')
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.restoreAllMocks()
  focusManager.setFocused(undefined)
  vi.unstubAllGlobals()
})
it('does not refetch on focus after a minute, but resolves a changed recipient', async () => {
  mocks.resolve.mockResolvedValue(wallet)
  await render('alice.eth')
  await settled()
  expect(result.address).toBe(wallet)

  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000)
  await act(async () => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
  })
  expect(result.address).toBe(wallet)
  expect(result.loading).toBe(false)
  expect(result.message).toBeUndefined()
  expect(mocks.resolve).toHaveBeenCalledTimes(1)

  mocks.resolve.mockResolvedValue('0x0000000000000000000000000000000000000002')
  await render('bob.eth')
  await settled()
  expect(result.address).toBe('0x0000000000000000000000000000000000000002')
  expect(mocks.resolve).toHaveBeenCalledTimes(2)
})

it('resolves legacy ENS through its registered resolver', async () => {
  mocks.resolve.mockResolvedValue(null)
  mocks.read.mockResolvedValueOnce('0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63').mockResolvedValueOnce(wallet)
  await render('jennie93.eth')
  await settled()
  expect(result.address).toBe(wallet)
  expect(mocks.read.mock.calls.map(([args]) => args.functionName)).toEqual(['resolver', 'addr'])
})
it('does not apply a late ENS result to a changed input', async () => {
  let finish!: (value: string) => void
  mocks.resolve.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve
      }),
  )
  await render('alice.eth')
  expect(result.address).toBeUndefined()
  expect(result.message).toBe('Resolving recipient')
  await render(wallet)
  await act(async () => finish('0x0000000000000000000000000000000000000002'))
  expect(result.address).toBe(wallet)
})
it.each([
  ['NEAR', 'alice.near', true],
  ['NEAR', 'Alice..near', false],
  ['Solana', '11111111111111111111111111111111', true],
  ['Solana', 'alice.near', false],
  ['Bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', true],
  ['Bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb', false],
])('checks %s address %s', async (networkName, value, valid) => {
  await render(value, { mode: 'nonEvm', networkName })
  await settled()
  expect(!!result.address).toBe(valid)
  expect(result.error).toBe(!valid)
})

it.each([
  ['0xa2DFeb674d997b68ec5adB0A6fb9136BD45C2D2d', true],
  ['0xa2dfeb674d997b68ec5adb0a6fb9136bd45c2d2d', true],
  ['0xa2dfeb674d997b68ec5adB0A6fb9136BD45C2D2d', false],
])('preserves EVM checksum validation for %s', async (value, valid) => {
  await render(value)
  await settled()
  expect(!!result.address).toBe(valid)
  expect(result.message).toBe(valid ? undefined : 'Invalid recipient')
  expect(mocks.resolve).not.toHaveBeenCalled()
})

it('keeps RPC failures blocked without labelling the ENS name invalid', async () => {
  mocks.resolve.mockRejectedValue(new Error('RPC timeout'))
  await render('alice.eth')
  await settled()
  expect(result.address).toBeUndefined()
  expect(result.error).toBe(true)
  expect(result.message).toBe('Enter a recipient')
})

it('still reports invalid when ENS has no registered resolver', async () => {
  mocks.resolve.mockResolvedValue(null)
  mocks.read.mockResolvedValue('0x0000000000000000000000000000000000000000')
  await render('missing.eth')
  await settled()
  expect(result.address).toBeUndefined()
  expect(result.message).toBe('Invalid recipient')
})
