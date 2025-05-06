import { Web3Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

import { formatDisplayNumber } from 'utils/numbers'
import { CoreProtocol, EarnDex, NFT_MANAGER_CONTRACT, PROTOCOLS_CORE_MAPPING } from 'pages/Earns/constants'
import { APP_PATHS } from 'constants/index'

export const formatAprNumber = (apr: string | number): string => {
  const formattedApr = Number(apr)
  let n = 0
  while (n < 4) {
    if (formattedApr - 10 ** n < 0) break
    n++
  }

  return formatDisplayNumber(formattedApr, { significantDigits: n + 2 })
}

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

export const isForkFrom = (protocol: EarnDex, coreProtocol: CoreProtocol) =>
  PROTOCOLS_CORE_MAPPING[protocol] === coreProtocol

export const navigateToPositionAfterZap = async (
  library: Web3Provider,
  txHash: string,
  chainId: number,
  dex: EarnDex,
  poolId: string,
  navigateFunc: (url: string) => void,
) => {
  let url
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)

  if (isUniv2) {
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', poolId)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', dex) + '?forceLoading=true'
  } else {
    const tokenId = await getTokenId(library, txHash)
    if (!tokenId) {
      navigateFunc(APP_PATHS.EARN_POSITIONS)
      return
    }
    const nftContractObj = NFT_MANAGER_CONTRACT[dex]
    const nftContract =
      typeof nftContractObj === 'string'
        ? nftContractObj
        : nftContractObj[chainId as unknown as keyof typeof nftContractObj]
    url =
      APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', `${nftContract}-${tokenId}`)
        .replace(':chainId', chainId.toString())
        .replace(':protocol', dex) + '?forceLoading=true'
  }

  navigateFunc(url)
}
