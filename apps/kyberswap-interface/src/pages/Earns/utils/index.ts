import { BigNumber } from '@ethersproject/bignumber'
import { TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'

import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { getReadingContractWithCustomChain } from 'utils/getContract'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { BlacklistedWalletError, ErrorName } from 'utils/transactionError'
import { keccak256, toBytes } from 'utils/viem'

export const getTokenId = async (provider: Web3Provider, txHash: string, exchange: Exchange) => {
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
  library?: Web3Provider
  txData: TransactionRequest
  onError?: (error: Error) => void
  isSmartConnector?: boolean
}) => {
  if (!library) throw new Error('Library is not ready!')
  try {
    const signer = library.getSigner()
    const account = await signer.getAddress()
    const network = await library.getNetwork()
    const value = txData.value ? BigNumber.from(txData.value) : BigNumber.from(0)
    const res = await sendEVMTransaction({
      account,
      library,
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

  return getReadingContractWithCustomChain(nftManagerContractAddress, nftManagerAbi, chainId as ChainId)
}

export const truncateSymbol = (symbol: string, maxLength = 10) =>
  symbol.length > maxLength ? symbol.slice(0, maxLength) + '...' : symbol
