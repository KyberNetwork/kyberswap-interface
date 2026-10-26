import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import type { WalletClient } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BitcoinToken, type Chain, NonEvmChain } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import { SymbiosisAdapter } from 'pages/CrossChainSwap/adapters/SymbiosisAdapter'
import type { Quote } from 'pages/CrossChainSwap/registry'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => ({ post }) } }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('pages/CrossChainSwap/utils', () => ({ CROSS_CHAIN_FEE_RECEIVER: '' }))

const account = '0x1111111111111111111111111111111111111111'
const target = '0x2222222222222222222222222222222222222222'
const adapter = new SymbiosisAdapter()
const makeQuote = (rawQuote: unknown, fromChain: Chain = ChainId.MAINNET): Quote => ({
  adapter,
  isReadOnly: false,
  quote: {
    quoteParams: {
      fromChain,
      toChain: 8453,
      fromToken: fromChain === NonEvmChain.Bitcoin ? BitcoinToken : new Token(ChainId.MAINNET, account, 8, 'WBTC'),
      toToken: new Token(ChainId.BASE, target, 6, 'USDC'),
      amount: '123456',
      sender: account,
      recipient: target,
      slippage: 50,
      feeBps: 10,
      tokenInUsd: 1,
      tokenOutUsd: 1,
    },
    outputAmount: 1_000_000n,
    formattedOutputAmount: '1',
    inputUsd: 1,
    outputUsd: 1,
    rate: 1,
    timeEstimate: 30,
    priceImpact: 0,
    contractAddress: target,
    rawQuote,
    additionalFeeUsd: 0,
    platformFeePercent: 0.1,
  },
})
const makeWallet = () => {
  const sendTransaction = vi.fn().mockResolvedValue('0xhash')
  return { wallet: { account: { address: account }, sendTransaction } as unknown as WalletClient, sendTransaction }
}

beforeEach(() => {
  post.mockResolvedValue({ data: {} })
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('Symbiosis stream execution', () => {
  it.each([{}, { tx: null }, { tx: { to: target } }])(
    'builds once when streamed EVM execution data is missing: %j',
    async rawQuote => {
      const { wallet, sendTransaction } = makeWallet()
      post.mockResolvedValue({ data: { tx: { chainId: 1, to: target, data: '0xabcd', value: '10' } } })
      await adapter.executeSwap(makeQuote(rawQuote), wallet)
      expect(post).toHaveBeenCalledOnce()
      expect(post).toHaveBeenCalledWith('/swap', expect.objectContaining({ from: account, to: target, slippage: 50 }))
      expect(sendTransaction).toHaveBeenCalledWith({
        chain: undefined,
        account,
        to: target,
        data: '0xabcd',
        value: 10n,
      })
    },
  )

  it('builds once for a missing BTC deposit address and keeps the refund address', async () => {
    const { wallet } = makeWallet()
    const sendBtc = vi.fn().mockResolvedValue('btc-hash')
    post.mockResolvedValue({ data: { tx: { depositAddress: 'bc1fallback' } } })
    await adapter.executeSwap(makeQuote({}, NonEvmChain.Bitcoin), wallet, undefined, sendBtc)
    expect(post).toHaveBeenCalledOnce()
    expect(post).toHaveBeenCalledWith('/swap', expect.objectContaining({ refundAddress: account }))
    expect(sendBtc).toHaveBeenCalledWith({ recipient: 'bc1fallback', amount: '123456' })
  })

  it('stops before sending when the fallback API fails', async () => {
    const { wallet, sendTransaction } = makeWallet()
    post.mockRejectedValue(new Error('Provider unavailable'))
    await expect(adapter.executeSwap(makeQuote({}), wallet)).rejects.toThrow('Provider unavailable')
    expect(post).toHaveBeenCalledOnce()
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it.each([undefined, '900000', 'invalid'])(
    'rejects fallback minimum output %s below the accepted minimum',
    async amount => {
      const { wallet, sendTransaction } = makeWallet()
      const quote = makeQuote({})
      quote.quote.minimumOutputAmount = 950000n
      post.mockResolvedValue({
        data: { tx: { to: target, data: '0xabcd' }, tokenAmountOutMin: { amount } },
      })
      await expect(adapter.executeSwap(quote, wallet)).rejects.toThrow('quote has changed')
      expect(sendTransaction).not.toHaveBeenCalled()
    },
  )

  it('accepts a fallback that preserves the minimum output and approval address', async () => {
    const { wallet, sendTransaction } = makeWallet()
    const quote = makeQuote({})
    quote.quote.minimumOutputAmount = 950000n
    post.mockResolvedValue({
      data: { tx: { to: target, data: '0xabcd' }, tokenAmountOutMin: { amount: '950000' }, approveTo: target },
    })
    await adapter.executeSwap(quote, wallet)
    expect(sendTransaction).toHaveBeenCalledOnce()
  })

  it('rejects a fallback with a different approval address', async () => {
    const { wallet, sendTransaction } = makeWallet()
    post.mockResolvedValue({ data: { tx: { to: target, data: '0xabcd' }, approveTo: account } })
    await expect(adapter.executeSwap(makeQuote({}), wallet)).rejects.toThrow('approval address has changed')
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it('sends the EVM transaction from the stream without requesting a new swap', async () => {
    const { wallet, sendTransaction } = makeWallet()
    const result = await adapter.executeSwap(
      makeQuote({ tx: { chainId: 1, to: target, data: '0x1234', value: '0x10' } }),
      wallet,
    )
    expect(sendTransaction).toHaveBeenCalledWith({ chain: undefined, account, to: target, data: '0x1234', value: 16n })
    expect(result).toMatchObject({ sourceTxHash: '0xhash', sourceChain: 1, inputAmount: '123456' })
    expect(post).not.toHaveBeenCalled()
  })

  it('defaults an omitted transaction value to zero', async () => {
    const { wallet, sendTransaction } = makeWallet()
    await adapter.executeSwap(makeQuote({ tx: { to: target, data: '0x1234' } }), wallet)
    expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({ value: 0n }))
  })

  it.each([
    {},
    { tx: null },
    { tx: { to: target } },
    { tx: { to: 'invalid', data: '0x1234' } },
    { tx: { to: target, data: '0x123' } },
    { tx: { to: target, data: '0x1234', value: '-1' } },
    { tx: { chainId: 56, to: target, data: '0x1234' } },
  ])('rejects invalid EVM transaction data before sending: %j', async rawQuote => {
    const { wallet, sendTransaction } = makeWallet()
    await expect(adapter.executeSwap(makeQuote(rawQuote), wallet)).rejects.toThrow('Please refresh the quote')
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it('sends BTC to the deposit address supplied by the stream', async () => {
    const { wallet, sendTransaction } = makeWallet()
    const sendBtc = vi.fn().mockResolvedValue('btc-hash')
    const result = await adapter.executeSwap(
      makeQuote(
        { tx: { depositAddress: 'bc1deposit', expiresAt: new Date(Date.now() + 60_000).toISOString() } },
        NonEvmChain.Bitcoin,
      ),
      wallet,
      undefined,
      sendBtc,
    )
    expect(sendBtc).toHaveBeenCalledWith({ recipient: 'bc1deposit', amount: '123456' })
    expect(sendTransaction).not.toHaveBeenCalled()
    expect(result.sourceTxHash).toBe('btc-hash')
    expect(post).not.toHaveBeenCalled()
  })

  it.each([
    {},
    { tx: { depositAddress: '' } },
    { tx: { depositAddress: 'bc1deposit', expiresAt: '2020-01-01T00:00:00.000Z' } },
    { tx: { depositAddress: 'bc1deposit', expiresAt: 'invalid' } },
  ])('rejects missing or expired BTC deposit data before sending: %j', async rawQuote => {
    const { wallet } = makeWallet()
    const sendBtc = vi.fn()
    await expect(
      adapter.executeSwap(makeQuote(rawQuote, NonEvmChain.Bitcoin), wallet, undefined, sendBtc),
    ).rejects.toThrow('Please refresh the quote')
    expect(sendBtc).not.toHaveBeenCalled()
  })
})
