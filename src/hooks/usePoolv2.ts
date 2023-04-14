import { Interface } from '@ethersproject/abi'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ProAmmPoolStateABI from 'constants/abis/v2/ProAmmPoolState.json'
import { NETWORKS_INFO, isEVM as isEVMNetwork } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useMulticallContract } from 'hooks/useContract'
import { PoolState } from 'hooks/usePools'

const PoolStateInterface = new Interface(ProAmmPoolStateABI.abi)

type CallParam = {
  callData: string
  target: string
  fragment: string
  key: string
}
const formatResult = (responseData: any, calls: CallParam[]): any => {
  const response: any = responseData.returnData
    ? responseData.returnData.map((item: [boolean, string]) => item[1])
    : responseData

  const resultList: { [key: string]: any } = {}
  if (!response) {
    return resultList
  }
  for (let i = 0, len = calls.length; i < len; i++) {
    const item = calls[i]
    if (!response[i]) continue
    let value: any
    try {
      value = PoolStateInterface?.decodeFunctionResult(item.fragment, response[i])
    } catch (error) {
      continue
    }
    const output = value || undefined
    if (output) resultList[item.key] = output
  }

  return resultList
}

const defaultValue = { slot0State: undefined, liquidityState: undefined }

const useGetPool = (
  chainId: ChainId,
  poolAddress: string | undefined,
  token0: Token | undefined,
  token1: Token | undefined,
  fee: FeeAmount | undefined,
): [PoolState, Pool | undefined] => {
  const [isLoading, setLoading] = useState(false)
  const [data, setData] = useState<{ slot0State: any; liquidityState: any }>(defaultValue)
  const multicallContract = useMulticallContract(chainId)

  const getPool = useCallback(async () => {
    if (!multicallContract || !poolAddress || !token0 || !token1 || !fee) {
      setData(defaultValue)
      setLoading(false)
      return
    }

    const callParams: CallParam[] = [
      {
        callData: PoolStateInterface.encodeFunctionData('getPoolState'),
        target: poolAddress,
        fragment: 'getPoolState',
        key: 'slot0State',
      },
      {
        callData: PoolStateInterface.encodeFunctionData('getLiquidityState'),
        target: poolAddress,
        fragment: 'getLiquidityState',
        key: 'liquidityState',
      },
    ]

    setLoading(true)
    const returnData = await multicallContract.callStatic.tryBlockAndAggregate(
      false,
      callParams.map(({ callData, target }) => ({ callData, target })),
    )

    const { slot0State, liquidityState } = formatResult(returnData, callParams)

    setData({ slot0State, liquidityState })
    setLoading(false)
  }, [token0, token1, fee, multicallContract, poolAddress])

  useEffect(() => {
    getPool()
  }, [getPool])

  return useMemo(() => {
    if (!token0 || !token1 || !fee) {
      return [PoolState.INVALID, undefined]
    }

    if (isLoading) {
      return [PoolState.LOADING, undefined]
    }

    if (!data.slot0State || !data.liquidityState) {
      console.log('PoolState.NOT_EXISTS 0')
      return [PoolState.NOT_EXISTS, undefined]
    }

    if (!data.slot0State.sqrtP || data.slot0State.sqrtP.eq(0)) {
      console.log('PoolState.NOT_EXISTS 1')
      return [PoolState.NOT_EXISTS, undefined]
    }

    try {
      const pool = new Pool(
        token0,
        token1,
        fee,
        data.slot0State.sqrtP,
        data.liquidityState.baseL,
        data.liquidityState.reinvestL,
        data.slot0State.currentTick,
      )
      return [PoolState.EXISTS, pool]
    } catch (error) {
      console.error('Error when constructing the pool', error)
      return [PoolState.NOT_EXISTS, undefined]
    }
  }, [data.liquidityState, data.slot0State, fee, isLoading, token0, token1])
}

export function usePoolv2(
  chainId: ChainId,
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
): {
  poolState: PoolState
  pool: Pool | undefined
  poolAddress: string | undefined
} {
  const isEVM = isEVMNetwork(chainId)
  const networkInfo = NETWORKS_INFO[chainId]

  const values: [Token, Token, FeeAmount] | undefined = useMemo(() => {
    if (!currencyA || !currencyB || !feeAmount) {
      return undefined
    }

    const tokenA = currencyA?.wrapped
    const tokenB = currencyB?.wrapped
    if (!tokenA || !tokenB || tokenA.equals(tokenB)) {
      return undefined
    }

    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    return [token0, token1, feeAmount]
  }, [currencyA, currencyB, feeAmount])

  const poolAddress: string | undefined = useMemo(() => {
    if (!isEVM || !values) {
      return undefined
    }

    const proAmmCoreFactoryAddress = (networkInfo as EVMNetworkInfo).elastic.coreFactory
    const param = {
      factoryAddress: proAmmCoreFactoryAddress,
      tokenA: values[0],
      tokenB: values[1],
      fee: values[2],
      initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
    }

    return computePoolAddress(param)
  }, [isEVM, networkInfo, values])

  const [poolState, pool] = useGetPool(chainId, poolAddress, values?.[0], values?.[1], values?.[2])

  return useMemo(() => {
    return {
      poolState,
      pool,
      poolAddress,
    }
  }, [pool, poolAddress, poolState])
}
