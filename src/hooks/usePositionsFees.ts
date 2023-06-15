import { ChainId } from '@kyberswap/ks-sdk-core'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'

import { useMulticallContract } from './useContract'

const tickReaderInterface = new Interface(TickReaderABI.abi)

export function usePositionsFees(
  positions: { poolAddress: string; id: string | number }[],
  customChainId?: ChainId,
): {
  [tokenId: string]: [string, string]
} {
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract(customChainId)

  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.id]: ['0', '0'] }), {}))

  const tickReaderAddress = (NETWORKS_INFO[customChainId || chainId] as EVMNetworkInfo)?.elastic.tickReader
  const nftManagerContract = (NETWORKS_INFO[customChainId || chainId] as EVMNetworkInfo)?.elastic
    .nonfungiblePositionManager

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
