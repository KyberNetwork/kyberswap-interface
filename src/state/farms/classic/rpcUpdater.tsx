import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Fraction, Token } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import { AbortedError, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { useFairLaunchContracts } from 'hooks/useContract'
import { AppState } from 'state'
import { useETHPrice, useKyberSwapConfig } from 'state/application/hooks'
import { setFarmsData, setLoading, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { getBulkPoolDataFromPoolList } from 'state/pools/hooks'

export default function RPCUpdater({ isInterval = true }: { isInterval?: boolean }): null {
  const dispatch = useAppDispatch()
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const fairLaunchContracts = useFairLaunchContracts()
  const ethPrice = useETHPrice()
  const ethPriceRef = useRef(ethPrice.currentPrice)
  ethPriceRef.current = ethPrice.currentPrice
  const allTokens = useAllTokens()
  const { classicClient, blockClient, isEnableBlockService } = useKyberSwapConfig()

  const farmsData = useSelector((state: AppState) => state.farms.data)

  const farmsDataRef = useRef(farmsData)
  farmsDataRef.current = farmsData

  // Fix slow network speed when loading farm.
  const latestChainId = useRef(chainId)
  latestChainId.current = chainId

  useEffect(() => {
    console.count('running farm updater')
    const abortController = new AbortController()

    async function getListFarmsForContract(contract: Contract): Promise<Farm[]> {
      const isV3 = networkInfo.classic.fairlaunchV3?.includes(contract.address)

      let rewardTokenAddresses: string[] = []
      if (!isV3) rewardTokenAddresses = await contract?.getRewardTokens()
      if (abortController.signal.aborted) throw new AbortedError()
      const poolLength = await contract?.poolLength()
      if (abortController.signal.aborted) throw new AbortedError()

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const isV2 = networkInfo.classic.fairlaunchV2.includes(contract.address)

      const rewardTokens = rewardTokenAddresses
        .map(address =>
          address.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? NativeCurrencies[chainId] : allTokens[address],
        )
        .filter(Boolean)

      const poolInfos = await Promise.all(
        pids.map(async (pid: number) => {
          const poolInfo = await contract?.getPoolInfo(pid)
          if (abortController.signal.aborted) throw new AbortedError()
          if (isV2 || isV3) {
            return {
              ...poolInfo,
              totalStake: new Fraction(
                poolInfo.totalStake.toString(),
                JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
              ),
              rewardPerSeconds: poolInfo.rewardPerSeconds.map((accRewardPerShare: BigNumber, index: number) =>
                accRewardPerShare.div(isV3 ? poolInfo.multipliers[index] : poolInfo.rewardMultipliers[index]),
              ),
              pid,
              fairLaunchVersion: isV3 ? FairLaunchVersion.V3 : FairLaunchVersion.V2,
              rewardTokens:
                (isV3
                  ? poolInfo.rewardTokens.map((rw: string) =>
                      rw.toLowerCase() === ZERO_ADDRESS || rw.toLowerCase() === ETHER_ADDRESS.toLowerCase()
                        ? NativeCurrencies[chainId]
                        : allTokens[rw] || new Token(chainId, rw, 18, 'unknown', 'unknown'),
                    )
                  : rewardTokens) || [],
            }
          }

          return {
            ...poolInfo,
            totalStake: new Fraction(
              poolInfo.totalStake.toString(),
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
            ),
            pid,
            fairLaunchVersion: FairLaunchVersion.V1,
            rewardTokens,
          }
        }),
      )

      const stakedBalances = await Promise.all(
        pids.map(async (pid: number) => {
          const stakedBalance = account ? await contract?.getUserInfo(pid, account as string) : { amount: 0 }
          if (abortController.signal.aborted) throw new AbortedError()

          return stakedBalance.amount
        }),
      )
      if (abortController.signal.aborted) throw new AbortedError()

      const pendingRewards = await Promise.all(
        pids.map(async (pid: number) => {
          const pendingRewards = account ? await contract?.pendingRewards(pid, account as string) : null
          if (abortController.signal.aborted) throw new AbortedError()

          return pendingRewards
        }),
      )
      if (abortController.signal.aborted) throw new AbortedError()

      const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

      const poolsData: ClassicPoolData[] = await getBulkPoolDataFromPoolList(
        isEnableBlockService,
        poolAddresses,
        classicClient,
        blockClient,
        chainId,
        ethPriceRef.current,
      )
      if (abortController.signal.aborted) throw new AbortedError()

      const farms: Farm[] = poolInfos.map((poolInfo, index) => {
        return {
          ...poolsData.find(
            (poolData: ClassicPoolData) => poolData && poolData.id.toLowerCase() === poolInfo.stakeToken.toLowerCase(),
          ),
          ...poolInfo,
          version: isV2 ? FairLaunchVersion.V2 : isV3 ? FairLaunchVersion.V3 : FairLaunchVersion.V1,
          rewardTokens: poolInfo.rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[index],
            rewards: [FairLaunchVersion.V2, FairLaunchVersion.V3].includes(poolInfo.fairLaunchVersion)
              ? pendingRewards[index]?.map((pendingReward: BigNumber, pendingRewardIndex: number) =>
                  pendingReward.div(
                    isV3 ? poolInfo.multipliers[pendingRewardIndex] : poolInfo.rewardMultipliers[pendingRewardIndex],
                  ),
                )
              : pendingRewards[index],
          },
        }
      })

      return farms.filter(farm => !!farm.totalSupply)
    }

    async function checkForFarms() {
      try {
        if (!fairLaunchContracts) {
          dispatch(setFarmsData({}))
          return
        }

        dispatch(setLoading(true))

        const result: { [key: string]: Farm[] } = {}

        const fairLaunchAddresses = Object.keys(fairLaunchContracts)
        const promises: Promise<Farm[]>[] = fairLaunchAddresses.map(address =>
          getListFarmsForContract(fairLaunchContracts[address]),
        )

        const promiseResult = await Promise.all(promises)
        if (abortController.signal.aborted) throw new AbortedError()
        fairLaunchAddresses.forEach((address, index) => {
          result[address] = promiseResult[index]
        })

        dispatch(setFarmsData(result))
      } catch (err) {
        if (err instanceof AbortedError) return
        if (abortController.signal.aborted) return
        console.error(err)
        dispatch(setYieldPoolsError(err as Error))
      }

      dispatch(setLoading(false))
    }

    dispatch(setFarmsData({}))
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
  }, [
    dispatch,
    chainId,
    fairLaunchContracts,
    account,
    networkInfo,
    classicClient,
    blockClient,
    allTokens,
    isInterval,
    isEnableBlockService,
  ])

  return null
}
