import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import type { Connection } from '@solana/web3.js'
import type { WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NonEvmChain } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import { MayanAdapter } from 'pages/CrossChainSwap/adapters/MayanAdapter'
import type { Quote } from 'pages/CrossChainSwap/registry'

const { build, solanaSwap } = vi.hoisted(() => ({ build: vi.fn(), solanaSwap: vi.fn() }))
vi.mock('@mayanfinance/swap-sdk', () => ({ swapFromSolana: solanaSwap }))
vi.mock('pages/CrossChainSwap/adapters/MayanAdapter/streamExecution', async importOriginal => ({
  ...(await importOriginal<typeof import('pages/CrossChainSwap/adapters/MayanAdapter/streamExecution')>()),
  buildEvmTransaction: build,
}))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('pages/CrossChainSwap/utils', () => ({ CROSS_CHAIN_FEE_RECEIVER: '', CROSS_CHAIN_FEE_RECEIVER_SOLANA: '' }))

const account = '0x1111111111111111111111111111111111111111'
const adapter = new MayanAdapter()
const makeQuote = (rawQuote: unknown): Quote => ({
  adapter,
  isReadOnly: false,
  quote: {
    quoteParams: {
      fromChain: ChainId.MAINNET,
      toChain: ChainId.BASE,
      fromToken: new Token(ChainId.MAINNET, account, 6, 'USDC'),
      toToken: new Token(ChainId.BASE, account, 6, 'USDC'),
      amount: '1000000',
      sender: account,
      recipient: account,
      slippage: 50,
      feeBps: 0,
      tokenInUsd: 1,
      tokenOutUsd: 1,
    },
    outputAmount: 1000000n,
    formattedOutputAmount: '1',
    inputUsd: 1,
    outputUsd: 1,
    rate: 1,
    timeEstimate: 30,
    priceImpact: 0,
    contractAddress: account,
    rawQuote,
    additionalFeeUsd: 0,
    platformFeePercent: 0,
  },
})
const raw = {
  type: 'SWIFT',
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: { contract: account, decimals: 6 },
  toToken: { contract: account, decimals: 6 },
  effectiveAmountIn64: '1000000',
  minAmountOut: 1,
}
const sendTransaction = vi.fn().mockResolvedValue('0xhash')
const wallet = { account: { address: account }, sendTransaction } as unknown as WalletClient
beforeEach(() => {
  vi.clearAllMocks()
})

describe('Mayan aggregator execution', () => {
  it('requires aggregator quotes', async () => {
    await expect(
      adapter.getQuote(makeQuote(raw).quote.quoteParams as Parameters<MayanAdapter['getQuote']>[0]),
    ).rejects.toThrow('aggregator stream')
  })
  it('sends a complete streamed tx without rebuilding', async () => {
    await adapter.executeSwap(makeQuote({ tx: { to: account, data: '0x1234', value: '10', chainId: 1 } }), wallet)
    expect(sendTransaction).toHaveBeenCalledWith({ chain: undefined, account, to: account, data: '0x1234', value: 10n })
    expect(build).not.toHaveBeenCalled()
  })
  it('uses the local builder when no tx is supplied', async () => {
    build.mockResolvedValue({ to: account, data: '0x1234', value: 0n, chainId: 1 })
    await adapter.executeSwap(makeQuote(raw), wallet)
    expect(build).toHaveBeenCalledOnce()
    expect(sendTransaction).toHaveBeenCalledOnce()
  })
  it.each([
    { to: account, data: '0x1234', chainId: 56 },
    { to: 'invalid', data: '0x1234' },
    { to: account, data: 'invalid' },
    { to: account },
  ])('rejects invalid streamed tx before wallet: %j', async tx => {
    await expect(adapter.executeSwap(makeQuote({ tx }), wallet)).rejects.toThrow()
    expect(build).not.toHaveBeenCalled()
    expect(sendTransaction).not.toHaveBeenCalled()
  })
  it('does not rebuild or resend after the wallet rejects', async () => {
    build.mockResolvedValue({ to: account, data: '0x1234', value: 0n, chainId: 1 })
    sendTransaction.mockRejectedValueOnce(new Error('User rejected'))
    await expect(adapter.executeSwap(makeQuote(raw), wallet)).rejects.toThrow('User rejected')
    expect(build).toHaveBeenCalledOnce()
    expect(sendTransaction).toHaveBeenCalledOnce()
  })
  it('allows the original Solana SDK path when the stream needs a source swap, without retries', async () => {
    const rawQuote = { ...raw, fromChain: 'solana', swiftInputContract: 'bridge-token' }
    const quote = makeQuote(rawQuote)
    quote.quote.quoteParams = { ...quote.quote.quoteParams, fromChain: NonEvmChain.Solana }
    const signTransaction = vi.fn()
    solanaSwap.mockRejectedValueOnce(new Error('SDK build failed'))
    await expect(
      adapter.executeSwap(
        quote,
        { signTransaction } as unknown as WalletClient,
        undefined,
        undefined,
        undefined,
        {} as Connection,
      ),
    ).rejects.toThrow('SDK build failed')
    expect(solanaSwap).toHaveBeenCalledOnce()
    expect(solanaSwap.mock.calls[0][0]).toEqual(rawQuote)
    expect(signTransaction).not.toHaveBeenCalled()
  })
  it('retains the status API', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ json: async () => ({ clientStatus: 'COMPLETED', fulfillTxHash: '0xdest' }) })
    vi.stubGlobal('fetch', fetch)
    try {
      const result = await adapter.getTransactionStatus({ id: '0xsource' } as Parameters<
        MayanAdapter['getTransactionStatus']
      >[0])
      expect(fetch).toHaveBeenCalledWith('https://explorer-api.mayan.finance/v3/swap/trx/0xsource')
      expect(result.status).toBe('Success')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
