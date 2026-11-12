import { getPublicClient } from '@wagmi/core'
import { BungeeAdapter } from 'services/crossChain/adapters/BungeeAdapter'
import { getBungeeStatus } from 'services/crossChain/adapters/BungeeAdapter/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NonEvmChain, type NormalizedTxResponse } from 'types/crossChain'

vi.mock('@wagmi/core', () => ({ getPublicClient: vi.fn() }))
vi.mock('components/Web3Provider/config', () => ({ wagmiConfig: {} }))
vi.mock('services/crossChain/adapters/BungeeAdapter/api', () => ({ getBungeeStatus: vi.fn() }))
vi.mock('services/crossChain/utils', () => ({ CROSS_CHAIN_FEE_RECEIVER: '', isWrappedToken: vi.fn() }))

const adapter = new BungeeAdapter()
const getTransactionReceipt = vi.fn()
const tx = { id: 'quote-id', sourceChain: 1, sourceTxHash: `0x${'a'.repeat(64)}` } as NormalizedTxResponse

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getPublicClient).mockReturnValue({ getTransactionReceipt } as any)
  vi.mocked(getBungeeStatus).mockResolvedValue({
    data: { success: true, result: { status: 'PENDING' } },
  } as any)
})

describe('Socket transaction status', () => {
  it('marks a reverted source transaction Failed without waiting for Socket', async () => {
    getTransactionReceipt.mockResolvedValue({ status: 'reverted' })
    expect(await adapter.getTransactionStatus(tx)).toEqual({ status: 'Failed', txHash: '' })
    expect(getBungeeStatus).not.toHaveBeenCalled()
  })

  it('keeps waiting for Socket after a successful source receipt', async () => {
    getTransactionReceipt.mockResolvedValue({ status: 'success' })
    expect(await adapter.getTransactionStatus(tx)).toMatchObject({ status: 'Processing' })
    expect(getBungeeStatus).toHaveBeenCalledWith({ quoteId: tx.id })
  })

  it('accepts Socket completion when the source RPC is unavailable', async () => {
    getTransactionReceipt.mockRejectedValue(new Error('RPC unavailable'))
    vi.mocked(getBungeeStatus).mockResolvedValue({
      data: { success: true, result: { status: 'COMPLETED', destination: { txHash: '0xdestination' } } },
    } as any)
    expect(await adapter.getTransactionStatus(tx)).toMatchObject({ status: 'Success', txHash: '0xdestination' })
  })

  it('continues polling Bitcoin deposits without an EVM receipt', async () => {
    expect(
      await adapter.getTransactionStatus({ ...tx, sourceChain: NonEvmChain.Bitcoin, sourceTxHash: 'btc-hash' }),
    ).toMatchObject({ status: 'Processing' })
    expect(getPublicClient).not.toHaveBeenCalled()
    expect(getBungeeStatus).toHaveBeenCalledWith({ quoteId: tx.id })
  })
})
