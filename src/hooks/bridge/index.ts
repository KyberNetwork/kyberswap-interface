import { Contract } from '@ethersproject/contracts'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import contractQuery from 'services/contractQuery'

import ERC20_INTERFACE from 'constants/abis/erc20'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import useInterval from 'hooks/useInterval'
import { useKyberSwapConfig } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { fetchChunk } from 'state/multicall/updater'
import { TokenAmountLoading } from 'state/wallet/hooks'
import { isTokenNative } from 'utils/tokenInfo'

export const useEthBalanceOfAnotherChain = (chainId: ChainId | undefined) => {
  const { readProvider } = useKyberSwapConfig(chainId)
  const { account } = useActiveWeb3React()
  const [balance, setBalance] = useState<CurrencyAmount<Currency>>()

  useEffect(() => {
    const controller = new AbortController()
    async function getBalance() {
      try {
        if (!readProvider || !account || !chainId) {
          setBalance(undefined)
          return
        }
        const balance = await readProvider.getBalance(account)
        if (controller.signal.aborted) {
          return
        }
        setBalance(CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], JSBI.BigInt(balance)))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        setBalance(undefined)
      }
    }
    getBalance()
    return () => controller.abort()
  }, [chainId, readProvider, account])

  return balance
}

export const useTokenBalanceOfAnotherChain = (chainId?: ChainId, token?: WrappedTokenInfo) => {
  const isNative = isTokenNative(token, chainId)
  const param = useMemo(() => (token && !isNative ? [token] : []), [token, isNative])

  const ethBalance = useEthBalanceOfAnotherChain(chainId)
  const [balances] = useTokensBalanceOfAnotherChain(chainId, param)

  return useMemo(() => {
    return isNative ? ethBalance : balances?.[0]?.[0]
  }, [balances, ethBalance, isNative])
}

export type FetchBalancesArg = {
  account?: string
  tokens: Currency[]
  multicallContract: Contract | null
  chainId?: ChainId
}

export const fetchBalancesQuery = async ({ account, tokens, multicallContract }: FetchBalancesArg) => {
  if (!account || !tokens.length || !multicallContract) return []
  const calls: CallParam[] = tokens.map(token => ({
    callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [account]),
    target: token.wrapped.address,
    fragment: 'balanceOf',
    key: token.wrapped.address,
  }))
  const { results } = await fetchChunk(
    multicallContract,
    calls.map(call => ({ address: call.target, callData: call.callData })),
    undefined as any,
  )
  const result = formatResult(results, calls)
  const balances = tokens.map(token => {
    const balance = result[token.wrapped.address]
    return [balance ? CurrencyAmount.fromRawAmount(token, JSBI.BigInt(balance)) : undefined, false]
  })
  return balances as TokenAmountLoading[]
}

export const useTokensBalanceOfAnotherChain = (
  chainId: ChainId | undefined,
  tokens: Currency[],
): [TokenAmountLoading[], boolean] => {
  const { account } = useActiveWeb3React()
  const multicallContract = useMulticallContract(chainId)

  const { data: balances = [], isLoading } = contractQuery.useFetchBalancesQuery({
    account,
    tokens,
    multicallContract,
    chainId,
  })

  return [balances, isLoading]
}

type TokenList = { anytoken: string; underlying: string }[]

type PoolBridgeInfoMap = {
  [address: string]: string
}

type CallParam = {
  callData: string
  target: string
  fragment: string
  key: string
}

function getCallParams(list: TokenList) {
  const calls: CallParam[] = list.map(item => ({
    callData: ERC20_INTERFACE.encodeFunctionData('balanceOf', [item.anytoken]),
    target: item.underlying,
    fragment: 'balanceOf',
    key: item.anytoken,
  }))
  return calls
}

const formatResult = (responseData: any, calls: CallParam[], defaultValue?: any): any => {
  const response = responseData.returnData
    ? responseData.returnData.map((item: [boolean, string]) => item[1])
    : responseData

  const resultList: { [key: string]: any } = {}
  if (!response) return resultList
  for (let i = 0, len = calls.length; i < len; i++) {
    const item = calls[i]
    if (!response[i]) continue
    let value = ''
    try {
      value = ERC20_INTERFACE?.decodeFunctionResult(item.fragment, response[i])?.toString()
    } catch (error) {
      continue
    }
    const output = value || defaultValue
    if (output) resultList[item.key] = output
  }
  return resultList
}

// get pool of list token of a chain
export function useMultichainPool(chainId: ChainId | undefined, tokenList: TokenList) {
  const [poolData, setPoolData] = useState<PoolBridgeInfoMap>()
  const multicallContract = useMulticallContract(chainId)
  const getEvmPoolsData = useCallback(async (): Promise<PoolBridgeInfoMap> => {
    if (!chainId) return Promise.reject('Wrong input')
    try {
      const calls = getCallParams(tokenList)
      const returnData = await multicallContract?.callStatic.tryBlockAndAggregate(
        false,
        calls.map(({ callData, target }) => ({ target, callData })),
      )
      return formatResult(returnData, calls, '0')
    } catch (error) {
      return Promise.reject(error)
    }
  }, [chainId, tokenList, multicallContract])

  const fetchPoolCallback = useCallback(async () => {
    try {
      const newData: PoolBridgeInfoMap = await getEvmPoolsData()
      // small object, no performance problem here
      if (JSON.stringify(newData || {}) !== JSON.stringify(poolData || {})) {
        setPoolData(newData)
      }
    } catch (e) {
      console.log(e)
    }
  }, [getEvmPoolsData, poolData])

  useEffect(() => {
    fetchPoolCallback()
  }, [fetchPoolCallback])

  useInterval(fetchPoolCallback, 10_000)

  const isStale = poolData && Object.keys(poolData).length && !tokenList.some(e => poolData[e.anytoken] !== undefined)
  return !chainId || isStale ? undefined : poolData
}
