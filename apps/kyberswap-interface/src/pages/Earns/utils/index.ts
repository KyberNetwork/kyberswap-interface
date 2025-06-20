import { TransactionRequest, Web3Provider } from '@ethersproject/providers'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import {
  CoreProtocol,
  EXCHANGES_CORE_PROTOCOL_MAPPING,
  EarnChain,
  EarnDex,
  Exchange,
  NATIVE_ADDRESSES,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  PROTOCOLS_CORE_MAPPING,
} from 'pages/Earns/constants'
import { calculateGasMargin } from 'utils'
import { getReadingContractWithCustomChain } from 'utils/getContract'

export const getTokenId = async (provider: Web3Provider, txHash: string) => {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || !receipt.logs) return
    const increaseLidEventTopic = ethers.utils.id('IncreaseLiquidity(uint256,uint128,uint256,uint256)')
    const increaseLidLogs = receipt.logs.filter((log: any) => log.topics[0] === increaseLidEventTopic)
    const increaseLidEvent = increaseLidLogs?.length ? increaseLidLogs[0] : undefined
    const hexTokenId = increaseLidEvent?.topics?.[1]
    if (!hexTokenId) return
    return Number(hexTokenId)
  } catch (error) {
    console.log('getTokenId error', error)
    return
  }
}

export const isForkFrom = (protocol: EarnDex | Exchange, coreProtocol: CoreProtocol) =>
  PROTOCOLS_CORE_MAPPING[protocol as EarnDex] === coreProtocol ||
  EXCHANGES_CORE_PROTOCOL_MAPPING[protocol as Exchange] === coreProtocol

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  NATIVE_ADDRESSES[chainId as EarnChain] === tokenAddress.toLowerCase() ||
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

export const getNftManagerContractAddress = (dex: EarnDex, chainId: number) => {
  const nftManagerContractElement = NFT_MANAGER_CONTRACT[dex]

  return typeof nftManagerContractElement === 'string'
    ? nftManagerContractElement
    : nftManagerContractElement[chainId as keyof typeof nftManagerContractElement]
}

export const getNftManagerContract = (dex: EarnDex, chainId: number) => {
  const nftManagerContractAddress = getNftManagerContractAddress(dex, chainId)
  const nftManagerAbi = NFT_MANAGER_ABI[dex]
  if (!nftManagerAbi) return

  return getReadingContractWithCustomChain(nftManagerContractAddress, nftManagerAbi, chainId as ChainId)
}
