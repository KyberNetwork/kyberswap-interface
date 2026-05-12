import { Contract } from '@ethersproject/contracts'
import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import contractQuery from 'services/contractQuery'

import { ERC20_ABI } from 'constants/abis/erc20'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import { useKyberSwapConfig } from 'state/application/hooks'
import { fetchChunk } from 'state/multicall/updater'
import { TokenAmountLoading } from 'state/wallet/hooks'
import { decodeFunctionResult, encodeFunctionData } from 'utils/viem'

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
    const i = setInterval(() => {
      getBalance()
    }, 15_000)
    return () => {
      controller.abort()
      clearInterval(i)
    }
  }, [chainId, readProvider, account])

  return balance
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
    callData: encodeFunctionData({ abi: ERC20_ABI, functionName: 'balanceOf', args: [account] }),
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

  const { data: balances = [], isLoading } = contractQuery.useFetchBalancesQuery(
    {
      account,
      tokens,
      multicallContract,
      chainId,
    },
    {
      pollingInterval: 10_000,
    },
  )

  return [balances, isLoading]
}

type CallParam = {
  callData: string
  target: string
  fragment: string
  key: string
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
      value = String(
        decodeFunctionResult({
          abi: ERC20_ABI,
          functionName: item.fragment as 'balanceOf',
          data: response[i],
        }),
      )
    } catch (error) {
      continue
    }
    const output = value || defaultValue
    if (output) resultList[item.key] = output
  }
  return resultList
}
