import { Interface } from '@ethersproject/abi'
import { Fraction } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { MAX_ALLOW_APY } from 'constants/index'
import { DEFAULT_REWARDS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { AppState } from 'state'
import { useBlockNumber } from 'state/application/hooks'
import { setFarmAddressToShare } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppSelector } from 'state/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { isAddressString } from 'utils'
import { getTradingFeeAPR, useFarmApr } from 'utils/dmm'

export const useRewardTokens = () => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const rewardTokensMulticallResult = useMultipleContractSingleData(
    networkInfo.classic.fairlaunch,
    new Interface(FAIRLAUNCH_ABI),
    'getRewardTokens',
  )

  const rewardTokensV2MulticallResult = useMultipleContractSingleData(
    networkInfo.classic.fairlaunchV2,
    new Interface(FAIRLAUNCH_V2_ABI),
    'getRewardTokens',
  )

  const defaultRewards = useMemo(() => {
    return DEFAULT_REWARDS[chainId] || []
  }, [chainId])

  return useMemo(() => {
    let result: string[] = []

    rewardTokensMulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    rewardTokensV2MulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    return [...defaultRewards, ...result]
  }, [rewardTokensMulticallResult, rewardTokensV2MulticallResult, defaultRewards])
}

export const useFarmsData = () => {
  const farmData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  return useMemo(() => ({ loading, error, data: farmData }), [error, farmData, loading])
}

export const useActiveAndUniqueFarmsData = (): { loading: boolean; error: string; data: Farm[] } => {
  const farmsData = useFarmsData()
  const blockNumber = useBlockNumber()

  return useMemo(() => {
    const currentTimestamp = Math.round(Date.now() / 1000)
    const { loading, error, data: farms } = farmsData

    const existedPairs: { [key: string]: boolean } = {}
    const uniqueAndActiveFarms = Object.values(farms)
      .flat()
      .filter(farm =>
        farm.version === FairLaunchVersion.V1 ? farm.endBlock > (blockNumber || -1) : farm.endTime > currentTimestamp,
      )
      .filter(farm => {
        const pairKey = `${farm.token0?.symbol} - ${farm.token1?.symbol}`
        if (existedPairs[pairKey]) return false
        existedPairs[pairKey] = true
        return true
      })

    return {
      loading,
      error,
      data: uniqueAndActiveFarms,
    }
  }, [blockNumber, farmsData])
}

export const useTotalApr = (farm: Farm) => {
  const poolAddressChecksum = isAddressString(farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = farm.totalStake.divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farm, liquidity.toString())
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  return { tradingFeeAPR, farmAPR, apr }
}

export const useShareFarmAddress = () => {
  const farmAddress = useAppSelector(state => state.farms.farmAddressToShare)
  const dispatch = useDispatch()
  const setFarmAddress = useCallback(
    (addr: string) => {
      dispatch(setFarmAddressToShare(addr))
    },
    [dispatch],
  )

  return [farmAddress, setFarmAddress] as const
}
