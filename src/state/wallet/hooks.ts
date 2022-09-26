import { Currency, CurrencyAmount, Token, TokenAmount } from '@namgold/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import ERC20_INTERFACE from 'constants/abis/erc20'
import { EMPTY_ARRAY, EMPTY_OBJECT } from 'constants/index'
import { isEVM } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useMulticallContract } from 'hooks/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from 'state/multicall/hooks'
import { isAddress } from 'utils'

import { useSOLBalance, useTokensBalanceSolana } from './solanaHooks'

export function useNativeBalance(): CurrencyAmount<Currency> | undefined {
  const { chainId } = useActiveWeb3React()
  const userEthBalance = useETHBalance()
  const userSolBalance = useSOLBalance()
  return isEVM(chainId) ? userEthBalance : userSolBalance
}

function useETHBalance(): CurrencyAmount<Currency> | undefined {
  const multicallContract = useMulticallContract()
  const { chainId, account } = useActiveWeb3React()

  const addressParam: (string | undefined)[] = useMemo(
    () => (account && isAddress(chainId, account) ? [account] || [undefined] : [undefined]),
    [chainId, account],
  )

  const result = useSingleCallResult(multicallContract, 'getEthBalance', addressParam)

  return useMemo(() => {
    const value = result?.result?.[0]
    if (value) return CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], JSBI.BigInt(value.toString()))
    return undefined
  }, [result, chainId])
}

const stringifyBalance = (balanceMap: { [key: string]: TokenAmount }) => {
  return Object.keys(balanceMap)
    .map(key => key + balanceMap[key].toExact())
    .join(',')
}

function useTokensBalance(tokens?: Token[]): [TokenAmount | undefined, boolean][] {
  const { chainId } = useActiveWeb3React()
  const userEthBalance = useTokensBalanceEVM(tokens)
  const userSolBalance = useTokensBalanceSolana(tokens)
  return isEVM(chainId) ? userEthBalance : userSolBalance
}

function useTokensBalanceEVM(tokens?: Token[]): [TokenAmount | undefined, boolean][] {
  const validatedTokenAddresses = useMemo(() => tokens?.map(token => token.address) ?? [], [tokens])
  const balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20_INTERFACE, 'balanceOf', [
    validatedTokenAddresses,
  ])
  return useMemo(
    () =>
      balances.map((balanceCall, i) => {
        const amount =
          balanceCall.result?.[0] && tokens?.[i]
            ? TokenAmount.fromRawAmount(tokens?.[i], balanceCall.result?.[0])
            : undefined
        return [amount, balanceCall.loading]
      }),
    [balances, tokens],
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  tokens?: Token[],
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const { account } = useActiveWeb3React()
  const balances = useTokensBalance(tokens)

  const anyLoading: boolean = useMemo(() => balances.some(balanceCall => balanceCall[1]), [balances])

  const balanceResult: { [key: string]: TokenAmount } = useMemo(
    () =>
      account && tokens && tokens.length > 0
        ? tokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
            const value = balances?.[i][0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = TokenAmount.fromRawAmount(token, amount)
            }
            return memo
          }, {})
        : EMPTY_OBJECT,
    [account, tokens, balances],
  )

  // `balanceResult` was calculated base on `balances`, when `balances` changes, `balanceResult` recalculated
  // again and return new instance of the result.
  // But sometimes (most time likely), new result and old result are same, but have different instance.
  // Below we are going to cache it, so if new result deep equals to old result, old result's instance will be use instead
  // This cache helps hooks which calling this hooks and depend on this result don't have to calculating again with new dependency changed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const balanceResultCached = useMemo(() => balanceResult, [stringifyBalance(balanceResult)])

  return [balanceResultCached, anyLoading]
}

export function useTokenBalances(tokens?: Token[]): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(token && [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(currencies?: (Currency | undefined)[]): CurrencyAmount<Currency>[] {
  const { account } = useActiveWeb3React()

  const tokens = useMemo(() => {
    const result = currencies?.filter((currency): currency is Token => currency?.isToken ?? false)
    return result?.length ? result : EMPTY_ARRAY
  }, [currencies])

  const tokenBalances = useTokenBalances(tokens)
  const ethBalance = useNativeBalance()

  return useMemo(
    () =>
      currencies?.map(currency => {
        if (!account || !currency) return undefined
        if (currency?.isNative) return ethBalance
        return tokenBalances[currency.address]
      }) ?? EMPTY_ARRAY,
    [account, currencies, ethBalance, tokenBalances],
  )
}

export function useCurrencyBalance(currency?: Currency): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(useMemo(() => [currency], [currency]))[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: TokenAmount | undefined } {
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  return useTokenBalances(allTokensArray) ?? EMPTY_OBJECT
}
