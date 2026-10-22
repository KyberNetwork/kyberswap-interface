import { Quote, ReferrerAddresses, getAmountOfFractionalAmount, getSwapFromEvmTxPayload } from '@mayanfinance/swap-sdk'
import { Address, Hex, decodeFunctionData, encodeFunctionData, parseAbi, zeroAddress } from 'viem'

import { evmTransactionSchema } from 'pages/CrossChainSwap/quote/rawQuote'

const forwarderAbi = parseAbi([
  'function forwardERC20(address,uint256,(uint256,uint256,uint8,bytes32,bytes32),address,bytes) payable',
  'function forwardEth(address,bytes) payable',
  'function swapAndForwardERC20(address,uint256,(uint256,uint256,uint8,bytes32,bytes32),address,bytes,address,uint256,address,bytes) payable',
  'function swapAndForwardEth(uint256,address,bytes,address,uint256,address,bytes) payable',
])
const zeroBytes32 = `0x${'0'.repeat(64)}` as Hex
const noPermit = [0n, 0n, 0, zeroBytes32, zeroBytes32] as const

const getBridgeInput = (quote: Quote) => {
  switch (quote.type) {
    case 'SWIFT':
      return quote.swiftInputContract
    case 'MCTP':
      return quote.mctpInputContract
    case 'FAST_MCTP':
      return quote.fastMctpInputContract
    default:
      return undefined
  }
}

export const buildEvmTransactionFromStream = async (
  quote: Quote,
  sender: string,
  recipient: string,
  referrers: ReferrerAddresses,
  chainId: number,
) => {
  // Keep this allowlist when upgrading the SDK: other branches may fetch provider data.
  if (quote.toChain === 'hypercore' || !['SWIFT', 'MCTP', 'FAST_MCTP', 'WH', 'MONO_CHAIN'].includes(quote.type)) {
    throw new Error('Mayan route cannot be built from the aggregator response')
  }
  const bridgeInput = getBridgeInput(quote)
  if (['SWIFT', 'MCTP', 'FAST_MCTP'].includes(quote.type) && !bridgeInput) {
    throw new Error('Mayan aggregator response is missing the bridge input token')
  }
  const needsSourceSwap = bridgeInput && quote.fromToken.contract !== bridgeInput
  const sourceSwap = needsSourceSwap
    ? evmTransactionSchema.parse({ to: quote.evmSwapRouterAddress, data: quote.evmSwapRouterCalldata })
    : undefined
  if (sourceSwap && (!quote.minMiddleAmount || sourceSwap.data === '0x')) {
    throw new Error('Mayan aggregator response is missing source swap data')
  }

  // Select the SDK's direct-input branch so it never calls /get-swap/evm.
  // Preserve amounts, decimals, fees and order fields: the SDK uses effectiveAmountIn64
  // for the inner bridge in both branches. Only the outer forwarder call changes below.
  const bridgeQuote = needsSourceSwap ? { ...quote, fromToken: { ...quote.fromToken, contract: bridgeInput } } : quote
  const bridgeTx = await getSwapFromEvmTxPayload(bridgeQuote, sender, recipient, referrers, sender, chainId, null, null)
  if (!sourceSwap || !bridgeInput) return bridgeTx

  // Extract only the inner bridge call; replace the SDK's direct-transfer wrapper below.
  const decoded = decodeFunctionData({ abi: forwarderAbi, data: bridgeTx.data as Hex })
  if (decoded.functionName !== 'forwardERC20' && decoded.functionName !== 'forwardEth') {
    throw new Error('Unexpected Mayan bridge transaction')
  }
  const [bridgeContract, bridgeData] =
    decoded.functionName === 'forwardERC20' ? [decoded.args[3], decoded.args[4]] : decoded.args
  const amountIn = BigInt(quote.effectiveAmountIn64)
  const decimals = quote.type === 'SWIFT' ? quote.swiftInputDecimals : 6
  if (!quote.minMiddleAmount || decimals === undefined) throw new Error('Mayan source swap amount is missing')
  const minimum = getAmountOfFractionalAmount(quote.minMiddleAmount, decimals)
  const nativeInput = quote.fromToken.contract === zeroAddress
  // Native MCTP reserves the bridge fee before swapping; the full amount is sent as tx.value.
  // ERC20 MCTP sends only the bridge fee as value; SWIFT/FAST_MCTP need no extra native fee.
  const bridgeFee = quote.type === 'MCTP' ? BigInt(bridgeTx.value?.toString() ?? '0') : 0n
  const swapAmount = nativeInput && quote.type === 'MCTP' ? amountIn - bridgeFee : amountIn
  if (swapAmount <= 0n) throw new Error('Mayan input amount does not cover the bridge fee')
  const swapAndBridge = [
    sourceSwap.to,
    sourceSwap.data,
    bridgeInput as Address,
    minimum,
    bridgeContract,
    bridgeData,
  ] as const
  // One atomic Forwarder call swaps through the aggregator router, checks minMiddleAmount,
  // then forwards the resulting bridge token to the inner bridge contract.
  const data = nativeInput
    ? encodeFunctionData({ abi: forwarderAbi, functionName: 'swapAndForwardEth', args: [swapAmount, ...swapAndBridge] })
    : encodeFunctionData({
        abi: forwarderAbi,
        functionName: 'swapAndForwardERC20',
        args: [quote.fromToken.contract as Address, amountIn, noPermit, ...swapAndBridge],
      })
  return { to: bridgeTx.to, data, value: nativeInput ? amountIn : bridgeFee, chainId }
}

// Aggregator responses normally contain the source router/calldata, so try that path first.
// Retain the original SDK builder only as a compatibility fallback for missing/unsupported
// stream data or local encoding failures. It may call Mayan's build API, but does not re-quote.
// This catch covers building only: never retry a wallet rejection or a submitted transaction.
export const buildEvmTransaction = async (
  quote: Quote,
  sender: string,
  recipient: string,
  referrers: ReferrerAddresses,
  chainId: number,
) => {
  try {
    return await buildEvmTransactionFromStream(quote, sender, recipient, referrers, chainId)
  } catch {
    return getSwapFromEvmTxPayload(quote, sender, recipient, referrers, sender, chainId, null, null)
  }
}
