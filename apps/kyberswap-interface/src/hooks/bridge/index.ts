import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { getPublicClient } from '@wagmi/core'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import contractQuery from 'services/contractQuery'

import { wagmiConfig } from 'components/Web3Provider'
import { ERC20_ABI } from 'constants/abis/erc20'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { TokenAmountLoading } from 'state/wallet/hooks'
import { Abi, Address } from 'utils/viem'

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
  chainId?: ChainId
}

export const fetchBalancesQuery = async ({ account, tokens, chainId }: FetchBalancesArg) => {
  if (!account || !tokens.length || !chainId) return []
  const publicClient = getPublicClient(wagmiConfig, { chainId: chainId as number })
  if (!publicClient) return []

  const results = await publicClient.multicall({
    contracts: tokens.map(token => ({
      address: token.wrapped.address as Address,
      abi: ERC20_ABI as Abi,
      functionName: 'balanceOf',
      args: [account],
    })),
    allowFailure: true,
  })

  return tokens.map((token, i) => {
    const item = results[i]
    if (!item || item.status !== 'success') return [undefined, false]
    const balance = item.result as bigint
    return [CurrencyAmount.fromRawAmount(token, JSBI.BigInt(balance.toString())), false]
  }) as TokenAmountLoading[]
}

export const useTokensBalanceOfAnotherChain = (
  chainId: ChainId | undefined,
  tokens: Currency[],
): [TokenAmountLoading[], boolean] => {
  const { account } = useActiveWeb3React()

  const { data: balances = [], isLoading } = contractQuery.useFetchBalancesQuery(
    {
      account,
      tokens,
      chainId,
    },
    {
      pollingInterval: 10_000,
    },
  )

  return [balances, isLoading]
}
