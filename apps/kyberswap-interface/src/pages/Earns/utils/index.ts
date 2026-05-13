import { ChainId, WETH } from '@kyberswap/ks-sdk-core'

import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { getReadingContractWithCustomChain } from 'utils/getContract'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { BlacklistedWalletError, ErrorName } from 'utils/transactionError'
import { keccak256, toBytes } from 'utils/viem'

// Structural shapes of the legacy ethers `Web3Provider` / `TransactionRequest`
// used by callers still on ethers. Kept local so this module no longer needs
// to import from `@ethersproject/*`; the actual ethers `Web3Provider` is
// passed through to `sendEVMTransaction` (cast at the boundary).
// Structural shape used by `submitTransaction` (signer + network) and `getTokenId`
// (receipt only). The receipt-only callers get the narrower `ReceiptProvider` below.
type ReceiptProvider = {
  getTransactionReceipt: (txHash: string) => Promise<{ logs?: Array<{ topics: string[] }> } | null>
}
type LegacyWeb3Provider = ReceiptProvider & {
  getSigner: () => { getAddress: () => Promise<string> }
  getNetwork: () => Promise<{ chainId: number }>
}

type LegacyTransactionRequest = {
  from?: string
  to?: string
  data?: string
  value?: string | number | bigint | { toString: () => string }
  gasLimit?: string | number | bigint
}

export const getTokenId = async (provider: ReceiptProvider, txHash: string, exchange: Exchange) => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
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
  library,
  txData,
  onError,
  isSmartConnector = false,
}: {
  library?: LegacyWeb3Provider
  txData: LegacyTransactionRequest
  onError?: (error: Error) => void
  isSmartConnector?: boolean
}) => {
  if (!library) throw new Error('Library is not ready!')
  try {
    const signer = library.getSigner()
    const account = await signer.getAddress()
    const network = await library.getNetwork()
    const value = txData.value ? BigInt(txData.value.toString()) : 0n
    const res = await sendEVMTransaction({
      account,
      // `sendEVMTransaction` still expects an ethers `Web3Provider`; this
      // module's structural shape is compatible — cast at the boundary so we
      // can drop the `@ethersproject/providers` import.
      library: library as Parameters<typeof sendEVMTransaction>[0]['library'],
      contractAddress: (txData.to ?? '') as string,
      encodedData: (txData.data ?? '0x') as string as `0x${string}`,
      value,
      errorInfo: { name: ErrorName.SwapError, wallet: undefined },
      isSmartConnector,
      chainId: network.chainId as ChainId,
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

export const getNftManagerContract = (dex: Exchange, chainId: number) => {
  const nftManagerContractAddress = getNftManagerContractAddress(dex, chainId)
  const nftManagerAbi = EARN_DEXES[dex].nftManagerContractAbi
  if (!nftManagerAbi || !nftManagerContractAddress) return

  return getReadingContractWithCustomChain(nftManagerContractAddress, nftManagerAbi as any, chainId as ChainId)
}

export const truncateSymbol = (symbol: string, maxLength = 10) =>
  symbol.length > maxLength ? symbol.slice(0, maxLength) + '...' : symbol
