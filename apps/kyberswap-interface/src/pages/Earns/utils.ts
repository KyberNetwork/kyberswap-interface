import { Web3Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

import { CoreProtocol, EarnDex, PROTOCOLS_CORE_MAPPING } from 'pages/Earns/constants'
import { formatDisplayNumber } from 'utils/numbers'

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
