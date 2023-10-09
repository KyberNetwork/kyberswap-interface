import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { FarmKN, useLazyGetFarmClassicQuery } from 'services/knprotocol'

import { AbortedError } from 'constants/index'
import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useKyberSwapConfig } from 'state/application/hooks'
import { setFarmsData, setLoading, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm, FarmV1, FarmV2 } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { parseNum } from 'utils/numbers'

const KNUpdater = ({ isInterval = true }: { isInterval?: boolean }) => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const { isEnableKNProtocol } = useKyberSwapConfig()
  const [fetchFarmKN] = useLazyGetFarmClassicQuery()

  const farmsData = useSelector((state: AppState) => state.farms.data)

  const farmsDataRef = useRef(farmsData)
  farmsDataRef.current = farmsData

  // Fix slow network speed when loading farm.
  const latestChainId = useRef(chainId)
  latestChainId.current = chainId

  useEffect(() => {
    console.count('running farm updater')
    const abortController = new AbortController()

    async function getListFarmsKN(): Promise<Farm[]> {
      try {
        if (!isEVM(chainId)) return []
        const farmsKN: FarmKN[] | undefined = (await fetchFarmKN(chainId)).data?.data.farmPools
        if (!farmsKN) return []

        const mapping = farmsKN.map(farmPool => {
          const [fairLaunchAddress] = farmPool.id.split('_')
          const pid = Number(farmPool.pid)
          const id = farmPool.pool.id
          const version =
            farmPool.version === 1
              ? FairLaunchVersion.V1
              : farmPool.version === 2
              ? FairLaunchVersion.V2
              : FairLaunchVersion.V3
          const rewardTokens = farmPool.rewardTokens.map(
            ({ id, decimals, symbol, name }) => new Token(chainId, id, Number(decimals), symbol, name),
          )
          const totalStake = parseNum(farmPool.stakedTvl)
          const stakeToken = id // todo namgold: check this
          const token0 = { id: farmPool.pool.token0.id, symbol: farmPool.pool.token0.symbol }
          const token1 = { id: farmPool.pool.token1.id, symbol: farmPool.pool.token1.symbol }
          const amp = Number(farmPool.pool.amp)
          const reserve0 = farmPool.pool.reserve0
          const reserve1 = farmPool.pool.reserve1
          const reserveUSD = farmPool.pool.reserveUSD
          const totalSupply = farmPool.pool.totalSupply
          const oneDayFeeUSD = farmPool.pool.feeUSD
          const oneDayFeeUntracked = '0'
          const userData = {} // todo namgold: fill this.

          const rewardPerUnits: BigNumber[] = farmPool.rewardPerUnits.map(i => parseUnits(String(i), 0))
          const start = Number(farmPool.start)
          const end = Number(farmPool.end)
          const lastReward = start // todo namgold: fill this.

          if (version === FairLaunchVersion.V1) {
            return {
              fairLaunchAddress,
              version,
              pid,
              id,
              rewardTokens,
              rewardPerBlocks: rewardPerUnits,
              totalStake,
              stakeToken,
              startBlock: start,
              endBlock: end,
              lastRewardBlock: lastReward,
              token0,
              token1,
              amp,
              reserve0,
              reserve1,
              reserveUSD,
              totalSupply,
              oneDayFeeUSD,
              oneDayFeeUntracked,
              userData,
            } as FarmV1
          }

          return {
            fairLaunchAddress,
            version,
            pid,
            id,
            rewardTokens,
            rewardPerSeconds: rewardPerUnits,
            totalStake,
            stakeToken,
            startTime: start,
            endTime: end,
            lastRewardTime: lastReward,
            token0,
            token1,
            amp,
            reserve0,
            reserve1,
            reserveUSD,
            totalSupply,
            oneDayFeeUSD,
            oneDayFeeUntracked,
            userData,
          } as FarmV2
        })
        return mapping
      } catch (error) {
        console.error('parse kn error', { error })
        throw error
      }
    }

    async function checkForFarms() {
      try {
        dispatch(setLoading(true))

        const farms: Farm[] = await getListFarmsKN()
        if (abortController.signal.aborted) throw new AbortedError()
        const data = farms.reduce((acc, cur) => {
          const id = cur.id
          if (!acc[id]) acc[id] = []
          acc[id].push(cur)
          return acc
        }, {} as { [key: string]: Farm[] })

        dispatch(setFarmsData(data))
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('fetch farmData KN error', { error: err })
          dispatch(setYieldPoolsError(err as Error))
        }
      } finally {
        dispatch(setLoading(false))
      }
    }

    checkForFarms()

    const i =
      isInterval &&
      setInterval(() => {
        checkForFarms()
      }, 30_000)

    return () => {
      abortController.abort()
      i && clearInterval(i)
    }
  }, [fetchFarmKN, dispatch, chainId, account, isEnableKNProtocol, isInterval])

  return null
}
export default KNUpdater
