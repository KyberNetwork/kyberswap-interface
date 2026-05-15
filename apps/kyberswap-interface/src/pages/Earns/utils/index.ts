import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { BlacklistedWalletError, ErrorName } from 'utils/transactionError'
import { Hash, keccak256, toBytes } from 'utils/viem'

type LegacyTransactionRequest = {
  from?: string
  to?: string
  data?: string
  value?: string | number | bigint | { toString: () => string }
  gasLimit?: string | number | bigint
}

export const getTokenId = async (chainId: number, txHash: string, exchange: Exchange) => {
  try {
    const publicClient = getPublicClient(wagmiConfig, { chainId })
    if (!publicClient) return

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hash })
    if (!receipt || !receipt.logs) return

    const isUniV4 = EARN_DEXES[exchange].isForkFrom === CoreProtocol.UniswapV4

    let hexTokenId
    if (!isUniV4) {
      const isQuickSwapV3 = exchange === Exchange.DEX_QUICKSWAPV3ALGEBRA
      const increaseLidEventTopic = keccak256(
        toBytes(
          !isQuickSwapV3
            ? 'IncreaseLiquidity(uint256,uint128,uint256,uint256)'
            : 'IncreaseLiquidity(uint256,uint128,uint128,uint256,uint256,address)',
        ),
      )
      const increaseLidLogs = receipt.logs.filter((log: any) => log.topics[0] === increaseLidEventTopic)
      const increaseLidEvent = increaseLidLogs?.length ? increaseLidLogs[0] : undefined
      hexTokenId = increaseLidEvent?.topics?.[1]
    } else {
      const transferEventTopic = keccak256(toBytes('Transfer(address,address,uint256)'))
      const transferLogsWithTokenId = receipt.logs.filter(
        (log: any) => log.topics[0] === transferEventTopic && log.topics.length === 4,
      )
      hexTokenId = !transferLogsWithTokenId.length
        ? undefined
        : transferLogsWithTokenId[transferLogsWithTokenId.length - 1].topics[3]
    }
    if (!hexTokenId) return
    return Number(hexTokenId)
  } catch (error) {
    console.log('getTokenId error', error)
    return
  }
}

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  EARN_CHAINS[chainId as EarnChain].nativeAddress === tokenAddress.toLowerCase()

export const isWrappedNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address.toLowerCase()

export const submitTransaction = async ({
  account,
  chainId,
  txData,
  onError,
  isSmartConnector = false,
}: {
  account: string | undefined
  chainId: ChainId | number | undefined
  txData: LegacyTransactionRequest
  onError?: (error: Error) => void
  isSmartConnector?: boolean
}) => {
  if (!account) throw new Error('Wallet is not connected')
  if (!chainId) throw new Error('Chain is not ready')
  try {
    const value = txData.value ? BigInt(txData.value.toString()) : 0n
    const res = await sendEVMTransaction({
      account,
      contractAddress: (txData.to ?? '') as string,
      encodedData: (txData.data ?? '0x') as string as `0x${string}`,
      value,
      errorInfo: { name: ErrorName.SwapError, wallet: undefined },
      isSmartConnector,
      chainId: chainId as ChainId,
    })

    return {
      txHash: res?.hash ?? null,
      error: null,
    }
  } catch (error) {
    if (error instanceof BlacklistedWalletError) throw error
    const txHash = (error as any)?.transactionHash as string | undefined
    if (txHash) {
      return {
        txHash,
        error: null,
      }
    }

    console.error('Submit transaction error:', error)
    if (onError) onError(error as Error)
    return {
      txHash: null,
      error: error as Error,
    }
  }
}

export const getNftManagerContractAddress = (dex: Exchange, chainId: number) => {
  const nftManagerContractElement = EARN_DEXES[dex].nftManagerContract

  return typeof nftManagerContractElement === 'string'
    ? nftManagerContractElement
    : nftManagerContractElement[chainId as keyof typeof nftManagerContractElement]
}

export const truncateSymbol = (symbol: string, maxLength = 10) =>
  symbol.length > maxLength ? symbol.slice(0, maxLength) + '...' : symbol
