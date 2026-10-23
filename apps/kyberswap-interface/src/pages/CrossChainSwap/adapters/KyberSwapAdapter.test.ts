import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import type { WalletClient } from 'viem'
import { expect, it, vi } from 'vitest'

import { KyberSwapAdapter } from './KyberSwapAdapter'

const { dispatch, getRoute, buildRoute } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  getRoute: vi.fn(),
  buildRoute: vi.fn(),
}))
vi.mock('state', () => ({ default: { dispatch } }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('services/route', () => ({
  AGGREGATOR_API_PATHS: { GET_ROUTE: '/routes', BUILD_ROUTE: '/build' },
  default: { endpoints: { getRoute: { initiate: getRoute }, buildRoute: { initiate: buildRoute } } },
}))

it('preserves provider USD values from a raw route response through execution build', async () => {
  const address = '0x1111111111111111111111111111111111111111'
  const tokenOut = '0x2222222222222222222222222222222222222222'
  const routeSummary = {
    tokenIn: address,
    tokenOut,
    amountIn: '1000000',
    amountOut: '2000000',
    amountInUsd: '0',
    amountOutUsd: '1.95',
    route: [],
  }
  dispatch.mockResolvedValueOnce({ data: { data: { routeSummary, routerAddress: address } } })
  const adapter = new KyberSwapAdapter()
  const quote = await adapter.getQuote({
    fromChain: ChainId.MAINNET,
    toChain: ChainId.MAINNET,
    fromToken: new Token(ChainId.MAINNET, address, 6),
    toToken: new Token(ChainId.MAINNET, tokenOut, 6),
    amount: '1000000',
    sender: address,
    recipient: address,
    slippage: 50,
    feeBps: 0,
    tokenInUsd: 1.1,
    tokenOutUsd: 1.2,
  })
  expect(quote.inputUsd).toBe(1.1)
  expect(quote.outputUsd).toBe(2.4)
  expect(getRoute).toHaveBeenCalledWith(expect.any(Object), { subscribe: false, forceRefetch: true })

  dispatch.mockResolvedValueOnce({ data: { data: { data: '0x1234', routerAddress: address } } })
  const sendTransaction = vi.fn().mockResolvedValue('0xhash')
  await adapter.executeSwap({ adapter, quote, isReadOnly: false }, {
    account: { address },
    sendTransaction,
  } as unknown as WalletClient)
  expect(buildRoute).toHaveBeenCalledWith(
    expect.objectContaining({ payload: expect.objectContaining({ routeSummary }) }),
  )
  expect(sendTransaction).toHaveBeenCalledOnce()
})
