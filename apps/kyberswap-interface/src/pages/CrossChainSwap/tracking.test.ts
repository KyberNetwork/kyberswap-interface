import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { describe, expect, it } from 'vitest'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { BitcoinToken, NearToken, NonEvmChain, SolanaToken } from 'pages/CrossChainSwap/adapters/types'
import { getSwapTrackingData, getTokenTrackingId } from 'pages/CrossChainSwap/tracking'

const nearToken: NearToken = {
  assetId: 'nep141:token.near',
  decimals: 6,
  blockchain: 'near',
  symbol: 'USDC',
  price: 1,
  priceUpdatedAt: 0,
  contractAddress: 'token.near',
  logo: '',
}
const solanaToken: SolanaToken = {
  id: 'solana-mint',
  name: 'USD Coin',
  symbol: 'USDC',
  icon: '',
  logo: '',
  decimals: 6,
  tokenProgram: '',
}

it('preserves chain-specific token identifiers, including native EVM tracking IDs', () => {
  const evmToken = new Token(ChainId.MAINNET, '0x0000000000000000000000000000000000000001', 6, 'USDC')
  expect(getTokenTrackingId(NonEvmChain.Bitcoin, BitcoinToken)).toBe('BTC')
  expect(getTokenTrackingId(NonEvmChain.Near, nearToken)).toBe(nearToken.assetId)
  expect(getTokenTrackingId(NonEvmChain.Solana, solanaToken)).toBe(solanaToken.id)
  expect(getTokenTrackingId(ChainId.MAINNET, NativeCurrencies[ChainId.MAINNET])).toBe(ETHER_ADDRESS)
  expect(getTokenTrackingId(ChainId.MAINNET, evmToken)).toBe(evmToken.address)
  expect(getTokenTrackingId(ChainId.MAINNET, JSON.parse(JSON.stringify(evmToken)))).toBe(evmToken.address)
})

describe('shared cross-chain tracking payload', () => {
  it.each(['1.25', '1250000'])('keeps caller-owned amount units (%s) and event fields unchanged', inputAmount => {
    expect(
      getSwapTrackingData({
        inputAmount,
        outputAmount: '1240000',
        amountInUsd: 1.25,
        amountOutUsd: 1.24,
        platformFeePercent: 0,
        sourceChain: NonEvmChain.Near,
        targetChain: NonEvmChain.Solana,
        sourceToken: nearToken,
        targetToken: solanaToken,
        adapter: 'KyberCross',
        sourceTxHash: 'source-hash',
        recipient: 'recipient',
        sender: 'sender',
      }),
    ).toEqual({
      amount_in: inputAmount,
      amount_in_usd: 1.25,
      amount_out: '1240000',
      amount_out_usd: 1.24,
      currency: 'USD',
      fee_percent: 0,
      from_chain: NonEvmChain.Near,
      from_chain_name: 'NEAR',
      from_token: nearToken.assetId,
      from_token_symbol: 'USDC',
      from_token_decimals: 6,
      to_chain: NonEvmChain.Solana,
      to_chain_name: 'Solana',
      to_token: solanaToken.id,
      to_token_symbol: 'USDC',
      to_token_decimals: 6,
      partner: 'KyberCross',
      platform: 'KyberSwap Cross-Chain',
      source_tx_hash: 'source-hash',
      recipient: 'recipient',
      sender: 'sender',
    })
  })
})
