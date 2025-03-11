import { ChainId } from '@kyberswap/ks-sdk-core'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { config } from 'hooks/useElasticLegacy'

import { useMulticallContract } from './useContract'

const tickReaderInterface = new Interface(TickReaderABI.abi)

export function usePositionsFees(
  positions: { poolAddress: string; id: string | number }[],
  isLegacy: boolean,
  customChainId?: ChainId,
): {
  [tokenId: string]: [string, string]
} {
  const { chainId: activeChainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract(customChainId)
  const chainId = customChainId || activeChainId

  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.id]: ['0', '0'] }), {}))

  let tickReaderAddress = NETWORKS_INFO[chainId]?.elastic.tickReader
  let nftManagerContract = NETWORKS_INFO[chainId]?.elastic.nonfungiblePositionManager

  if (isLegacy) {
    tickReaderAddress = config[chainId].tickReaderContract
    nftManagerContract = config[chainId].positionManagerContract
  }

  const getPositionFee = useCallback(async () => {
    if (!multicallContract) return
    const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
    const callParams = positions.map(item => {
      return {
        target: tickReaderAddress,
        callData: tickReaderInterface.encodeFunctionData(fragment, [nftManagerContract, item.poolAddress, item.id]),
      }
    })

    const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
    setFeeRewards(
      returnData.reduce(
        (
          acc: { [tokenId: string]: [string, string] },
          item: { success: boolean; returnData: string },
          index: number,
        ) => {
          if (item.success) {
            const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
            return {
              ...acc,
              [positions[index].id]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
            }
          }
          return { ...acc, [positions[index].id]: ['0', '0'] }
        },
        {} as { [tokenId: string]: [string, string] },
      ),
    )
    // eslint-disable-next-line
  }, [multicallContract, positions.length, nftManagerContract, tickReaderAddress])

  useEffect(() => {
    getPositionFee()
  }, [getPositionFee])

  return feeRewards
}
