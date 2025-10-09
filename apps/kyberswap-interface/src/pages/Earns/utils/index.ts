import { TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { calculateGasMargin } from 'utils'
import { getReadingContractWithCustomChain } from 'utils/getContract'

export const getTokenId = async (provider: Web3Provider, txHash: string, exchange: Exchange) => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || !receipt.logs) return

    const isUniV4 = EARN_DEXES[exchange].isForkFrom === CoreProtocol.UniswapV4

    let hexTokenId
    if (!isUniV4) {
      const isQuickSwapV3 = exchange === Exchange.DEX_QUICKSWAPV3ALGEBRA
      const increaseLidEventTopic = ethers.utils.id(
        !isQuickSwapV3
          ? 'IncreaseLiquidity(uint256,uint128,uint256,uint256)'
          : 'IncreaseLiquidity(uint256,uint128,uint128,uint256,uint256,address)',
      )
      const increaseLidLogs = receipt.logs.filter((log: any) => log.topics[0] === increaseLidEventTopic)
      const increaseLidEvent = increaseLidLogs?.length ? increaseLidLogs[0] : undefined
      hexTokenId = increaseLidEvent?.topics?.[1]
    } else {
      const transferEventTopic = ethers.utils.id('Transfer(address,address,uint256)')
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
  EARN_CHAINS[chainId as EarnChain].nativeAddress === tokenAddress.toLowerCase() ||
  (WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address.toLowerCase())

export const submitTransaction = async ({
  library,
  txData,
  onError,
}: {
  library?: Web3Provider
  txData: TransactionRequest
  onError?: (error: Error) => void
}) => {
  if (!library) throw new Error('Library is not ready!')
  try {
    const estimate = await library.getSigner().estimateGas(txData)
    const res = await library.getSigner().sendTransaction({
      ...txData,
      gasLimit: calculateGasMargin(estimate),
    })

    return {
      txHash: res.hash,
      error: null,
    }
  } catch (error) {
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
