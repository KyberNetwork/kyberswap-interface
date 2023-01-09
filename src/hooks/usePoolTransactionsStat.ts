import { useQuery } from '@apollo/client'
import ms from 'ms.macro'

import { RECENT_POOL_TX } from 'apollo/queries/promm'
import { POOL_TRANSACTION_TYPE } from 'components/ProAmm/type'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'

type RecentPoolTxsResult = {
  mints: { id: string }[]
  burns: { id: string }[]
}

const usePoolTransactionsStat = (
  poolAddress: string,
):
  | {
      name: string
      value: number
      percent: number
      type: POOL_TRANSACTION_TYPE
    }[]
  | undefined => {
  const { isEVM, networkInfo } = useActiveWeb3React()
  const client = (networkInfo as EVMNetworkInfo).elasticClient

  const { data } = useQuery<RecentPoolTxsResult>(RECENT_POOL_TX(poolAddress?.toLowerCase()), {
    client,
    pollInterval: ms`30s`,
    skip: !isEVM,
  })

  if (!data) return undefined
  const addCount = data.mints.length
  const removeCount = data.burns.length
  const sum = addCount + removeCount

  return [
    { name: 'Add Liquidity', value: addCount, percent: addCount / sum, type: POOL_TRANSACTION_TYPE.ADD },
    { name: 'Remove Liquidity', value: removeCount, percent: removeCount / sum, type: POOL_TRANSACTION_TYPE.REMOVE },
  ]
}

export default usePoolTransactionsStat
