// @vitest-environment happy-dom
import type { useWalletSelector } from '@near-wallet-selector/react-hook'
import type { WalletClient } from 'viem'
import { afterEach, expect, it, vi } from 'vitest'

import type { Quote } from 'pages/Swap/crossChain/registry'

import { NearToken, NonEvmChain } from '../types'
import { NearIntentsAdapter } from './index'
import {
  getMyNearWalletPendingTransaction,
  getNearTransferHash,
  removeMyNearWalletPendingTransaction,
} from './pendingTransaction'

const transferHash = '7'.repeat(44)
const storageHash = '8'.repeat(44)
const depositAddress = 'deposit.near'

const setup = (native = true, walletId = 'hot-wallet') => {
  const adapter = new NearIntentsAdapter()
  const token = {
    assetId: native ? 'near' : 'nep141:token.near',
    contractAddress: 'token.near',
    decimals: 24,
    symbol: 'NEAR',
  } as NearToken
  const quote: Quote = {
    adapter,
    isReadOnly: false,
    quote: {
      quoteId: 'quote-id',
      quoteToken: 'quote-token',
      quoteParams: {
        fromChain: NonEvmChain.Near,
        toChain: NonEvmChain.Near,
        fromToken: token,
        toToken: token,
        amount: '100',
        sender: 'sender.near',
        recipient: 'recipient.near',
        slippage: 50,
        feeBps: 0,
        tokenInUsd: 1,
        tokenOutUsd: 1,
      },
      outputAmount: 90n,
      formattedOutputAmount: '90',
      inputUsd: 1,
      outputUsd: 0.9,
      rate: 0.9,
      timeEstimate: 60,
      priceImpact: 0,
      platformFeePercent: 0,
      contractAddress: depositAddress,
      rawQuote: {
        quote: { depositAddress, minAmountOut: '90' },
        quoteRequest: {
          dry: false,
          swapType: 'EXACT_INPUT',
          slippageTolerance: 50,
          originAsset: token.assetId,
          destinationAsset: token.assetId,
          depositType: 'ORIGIN_CHAIN',
          refundType: 'ORIGIN_CHAIN',
          recipientType: 'DESTINATION_CHAIN',
          amount: '100',
          refundTo: 'sender.near',
          recipient: 'recipient.near',
          deadline: '2030-01-01T00:00:00Z',
        },
      },
    },
  }
  const send = vi
    .fn()
    .mockResolvedValue((native ? [transferHash] : [storageHash, transferHash]).map(hash => ({ transaction: { hash } })))
  const hookSend = vi.fn().mockResolvedValue([null]) // Hook strips the raw transaction outcomes.
  const wallet = {
    signedAccountId: 'sender.near',
    wallet: { id: walletId, signAndSendTransactions: send },
    signAndSendTransactions: hookSend,
  } as unknown as ReturnType<typeof useWalletSelector>
  const onSourceTransaction = vi.fn()
  const run = () =>
    adapter.executeSwap(quote, {} as WalletClient, wallet, undefined, undefined, undefined, onSourceTransaction)
  return { run, send, hookSend, onSourceTransaction }
}

afterEach(removeMyNearWalletPendingTransaction)

it.each([true, false])('tracks the raw transfer hash for native=%s', async native => {
  const { run, send, hookSend, onSourceTransaction } = setup(native)
  expect(await run()).toMatchObject({ sourceTxHash: transferHash, depositAddress })
  expect(send.mock.calls[0][0].transactions).toHaveLength(native ? 1 : 2)
  expect(hookSend).not.toHaveBeenCalled()
  expect(onSourceTransaction).toHaveBeenCalledOnce()
  expect(onSourceTransaction).toHaveBeenCalledWith(transferHash, { id: depositAddress, depositAddress })
})

it.each([true, false])('retains redirect context until MyNearWallet returns hashes for native=%s', async native => {
  const { run, send, onSourceTransaction } = setup(native, 'my-near-wallet')
  send.mockResolvedValue(undefined) // requestSignTransactions starts navigation and returns void.
  expect(await run()).toBeUndefined()
  const pending = getMyNearWalletPendingTransaction()
  expect(pending).toMatchObject({ depositAddress, quoteId: 'quote-id', quoteToken: 'quote-token' })
  expect(pending).not.toHaveProperty('sourceTxHash')
  expect(onSourceTransaction).not.toHaveBeenCalled()
  const hashes = native ? transferHash : `${storageHash},${transferHash}`
  expect(getNearTransferHash(hashes.split(','), pending?.expectedTransactions)).toBe(transferHash)
  if (!native) expect(getNearTransferHash([storageHash], pending?.expectedTransactions)).toBeUndefined()
})

it('clears redirect context when signing is rejected', async () => {
  const { run, send, onSourceTransaction } = setup(true, 'my-near-wallet')
  send.mockRejectedValue(new Error('User rejected'))
  await expect(run()).rejects.toThrow('User rejected')
  expect(getMyNearWalletPendingTransaction()).toBeNull()
  expect(onSourceTransaction).not.toHaveBeenCalled()
})

it('does not register an FT storage transaction when the transfer outcome is missing', async () => {
  const { run, send, onSourceTransaction } = setup(false)
  send.mockResolvedValue([{ transaction: { hash: storageHash } }])
  await expect(run()).rejects.toThrow('Source transaction hash is unavailable')
  expect(onSourceTransaction).not.toHaveBeenCalled()
})
