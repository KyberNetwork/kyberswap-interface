import { ETHER_ADDRESS } from 'constants/index'
import { Chain, Currency, NonEvmChain, NormalizedTxResponse } from 'pages/Swap/crossChain/adapters/types'
import { isNearToken, isSolanaToken } from 'pages/Swap/crossChain/quote/utils'
import { getChainName } from 'pages/Swap/crossChain/utils'

export const getTokenTrackingId = (chain: Chain, token: Currency) => {
  if (chain === NonEvmChain.Bitcoin) return token.symbol
  if (chain === NonEvmChain.Solana && isSolanaToken(token)) return token.id
  if (chain === NonEvmChain.Near && isNearToken(token)) return token.assetId
  if ('isNative' in token && token.isNative) return ETHER_ADDRESS
  if ('address' in token && typeof token.address === 'string') return token.address
  if ('wrapped' in token && typeof token.wrapped?.address === 'string') return token.wrapped.address

  return token.symbol
}

type SwapTrackingData = Pick<
  NormalizedTxResponse,
  | 'inputAmount'
  | 'outputAmount'
  | 'amountInUsd'
  | 'amountOutUsd'
  | 'platformFeePercent'
  | 'sourceChain'
  | 'targetChain'
  | 'sourceToken'
  | 'targetToken'
  | 'adapter'
  | 'sourceTxHash'
  | 'recipient'
  | 'sender'
>

// Initiation and status updates retain their own amount units, target hash and timestamps.
export const getSwapTrackingData = (tx: SwapTrackingData) => ({
  amount_in: tx.inputAmount,
  amount_in_usd: tx.amountInUsd,
  amount_out: tx.outputAmount,
  amount_out_usd: tx.amountOutUsd,
  currency: 'USD',
  fee_percent: tx.platformFeePercent,
  from_chain: tx.sourceChain,
  from_chain_name: getChainName(tx.sourceChain),
  from_token: getTokenTrackingId(tx.sourceChain, tx.sourceToken),
  from_token_symbol: tx.sourceToken.symbol,
  from_token_decimals: tx.sourceToken.decimals,
  to_chain: tx.targetChain,
  to_chain_name: getChainName(tx.targetChain),
  to_token: getTokenTrackingId(tx.targetChain, tx.targetToken),
  to_token_symbol: tx.targetToken.symbol,
  to_token_decimals: tx.targetToken.decimals,
  partner: tx.adapter,
  platform: 'KyberSwap Cross-Chain',
  source_tx_hash: tx.sourceTxHash,
  recipient: tx.recipient,
  sender: tx.sender,
})
