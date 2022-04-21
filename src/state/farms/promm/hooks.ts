import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { useCallback } from 'react'
import { useActiveWeb3React } from 'hooks'
import { FARM_CONTRACTS } from 'constants/v2'
import { ChainId } from '@vutien/sdk-core'
import { updatePrommFarms, setLoading } from './actions'
import { useProMMFarmContracts, useProMMFarmContract, useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { BigNumber } from 'ethers'
import { ProMMFarm } from './types'
import { PROMM_POOLS_BULK } from 'apollo/queries/promm'
import { prommClient } from 'apollo/client'
import { usePoolBlocks, parsedPoolData } from 'state/prommPools/hooks'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'
import { useSingleContractMultipleData } from 'state/multicall/hooks'

export const useProMMFarms = () => {
  return useSelector((state: AppState) => state.prommFarms)
}

export const useGetProMMFarms = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const prommFarmContracts = useProMMFarmContracts()

  const { block24, block48 } = usePoolBlocks()

  const getProMMFarms = useCallback(async () => {
    const farmsAddress = FARM_CONTRACTS[chainId as ChainId]
    if (!farmsAddress) {
      dispatch(updatePrommFarms({}))
      return
    }
    dispatch(setLoading(true))

    const promises = farmsAddress.map(async address => {
      const contract = prommFarmContracts?.[address]
      if (!contract) return

      const poolLength = await contract.poolLength()
      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const poolInfos: ProMMFarm[] = await Promise.all(
        pids.map(async id => {
          const poolInfo: ProMMFarm = await contract.getPoolInfo(id)
          return {
            pid: id,
            ...poolInfo,
          }
        }),
      )

      return poolInfos
    })

    const farms = await Promise.all(promises)

    const client = prommClient[chainId as ChainId]

    const poolAddreses = [...new Set(farms.flat().map(p => p?.pAddress.toLowerCase()))].filter(
      item => !!item,
    ) as string[]

    const [{ data }, { data: data24 }, { data: data48 }] = await Promise.all([
      client.query({
        query: PROMM_POOLS_BULK(undefined, poolAddreses),
        fetchPolicy: 'no-cache',
      }),

      client.query({
        query: PROMM_POOLS_BULK(block24, poolAddreses),
        fetchPolicy: 'no-cache',
      }),

      client.query({
        query: PROMM_POOLS_BULK(block48, poolAddreses),
        fetchPolicy: 'no-cache',
      }),
    ])

    const formattedData = parsedPoolData(poolAddreses, data, data24, data48)

    dispatch(
      updatePrommFarms(
        farmsAddress.reduce((acc, address, index) => {
          return {
            ...acc,
            [address]: farms[index]?.map(farm => ({
              ...farm,
              poolInfo: formattedData[farm.pAddress.toLowerCase()],
            })),
          }
        }, {}),
      ),
    )
    dispatch(setLoading(false))
  }, [chainId, dispatch, prommFarmContracts])

  return getProMMFarms
}

export const useFarmAction = (address: string) => {
  const { account } = useActiveWeb3React()
  const addTransactionWithType = useTransactionAdder()
  const contract = useProMMFarmContract(address)
  const posManager = useProAmmNFTPositionManagerContract()

  const isApprovedForAll =
    useSingleContractMultipleData(posManager, 'isApprovedForAll', [[account || '', address]])?.[0]?.result?.[0] || false

  const approve = useCallback(async () => {
    if (!posManager) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    const estimateGas = await posManager.estimateGas.setApprovalForAll(address, true)
    const tx = await posManager.setApprovalForAll(address, true, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    addTransactionWithType(tx, { type: 'Approve', summary: `Elastic Farm` })

    return tx.hash
  }, [])

  // Deposit
  const deposit = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.deposit(nftIds)
      const tx = await contract.deposit(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Deposit', summary: `${nftIds.length} NFT Positions` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  return { isApprovedForAll, deposit, approve }
}
