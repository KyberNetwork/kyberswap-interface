import { getPublicClient } from '@wagmi/core'
import { isSourceTransactionReverted } from 'services/crossChain/adapters/sourceTransaction'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NonEvmChain } from 'types/crossChain'

vi.mock('@wagmi/core', () => ({ getPublicClient: vi.fn() }))
vi.mock('components/Web3Provider/config', () => ({ wagmiConfig: {} }))

const getTransactionReceipt = vi.fn()
const tx = { sourceChain: 1, sourceTxHash: `0x${'a'.repeat(64)}` }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getPublicClient).mockReturnValue({ getTransactionReceipt } as any)
})

describe('source transaction revert detection', () => {
  it('detects a reverted source transaction on its source chain', async () => {
    getTransactionReceipt.mockResolvedValue({ status: 'reverted' })
    expect(await isSourceTransactionReverted(tx)).toBe(true)
    expect(getPublicClient).toHaveBeenCalledWith({}, { chainId: 1 })
    expect(getTransactionReceipt).toHaveBeenCalledWith({ hash: tx.sourceTxHash })
  })

  it.each([{ status: 'success' }, undefined])('does not infer failure from receipt %j', async receipt => {
    getTransactionReceipt.mockResolvedValue(receipt)
    expect(await isSourceTransactionReverted(tx)).toBe(false)
  })

  it('leaves provider polling available when receipt lookup fails', async () => {
    getTransactionReceipt.mockRejectedValue(new Error('Receipt unavailable'))
    expect(await isSourceTransactionReverted(tx)).toBe(false)
  })

  it('handles a chain without a public client', async () => {
    vi.mocked(getPublicClient).mockReturnValue(undefined)
    expect(await isSourceTransactionReverted(tx)).toBe(false)
  })

  it.each([
    { sourceChain: NonEvmChain.Bitcoin, sourceTxHash: 'btc-hash' },
    { sourceChain: NonEvmChain.Solana, sourceTxHash: 'signature' },
    { sourceChain: 1, sourceTxHash: '' },
  ])('skips EVM RPC for %j', async transaction => {
    expect(await isSourceTransactionReverted(transaction)).toBe(false)
    expect(getPublicClient).not.toHaveBeenCalled()
  })
})
