import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'

import { ERC20_ABI } from 'constants/abis'
import { EMPTY_ARRAY } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useEthBalanceOfAnotherChain, useTokensBalanceOfAnotherChain } from 'hooks/bridge'
import { useMulticallContract } from 'hooks/useContract'
import { useAllTokens } from 'hooks/useTokens'
import { useBlockNumberFor } from 'state/application/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useMultipleContractSingleData, useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { publishLiveBalances, retireLiveBalances } from 'state/walletInventory/store'
import { isAddress } from 'utils/address'
import { isTokenNative } from 'utils/tokenInfo'

const EMPTY_OBJECT: any = {}

export function useNativeBalance(customChain?: ChainId): CurrencyAmount<Currency> | undefined {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const isFetchOtherChain = chainId !== currentChain

  const userEthBalanceAnotherChain = useEthBalanceOfAnotherChain(isFetchOtherChain ? chainId : undefined)
  const userEthBalance = useETHBalance()

  const evmBalance = isFetchOtherChain ? userEthBalanceAnotherChain : userEthBalance
  return evmBalance
}

function useETHBalance(): CurrencyAmount<Currency> | undefined {
  const { chainId, account } = useActiveWeb3React()
  const multicallContract = useMulticallContract()

  const addressParam: (string | undefined)[] = useMemo(
    () => (account && isAddress(chainId, account) ? [account] : [undefined]),
    [chainId, account],
  )

  const result = useSingleCallResult(multicallContract, 'getEthBalance', addressParam)
  const value: string | undefined = result?.result?.[0]?.toString?.()

  return useMemo(() => {
    if (value) return CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], JSBI.BigInt(value))
    return undefined
  }, [value, chainId])
}

const stringifyBalance = (balanceMap: { [key: string]: TokenAmount }) => {
  return Object.keys(balanceMap)
    .map(key => key + balanceMap[key].toExact())
    .join(',')
}

export type TokenAmountLoading = [TokenAmount | undefined, boolean]

function useTokensBalance(tokens?: Token[]): TokenAmountLoading[] {
  const userEthBalance = useTokensBalanceEVM(tokens)
  return userEthBalance
}

function useTokensBalanceEVM(tokens?: Token[]): TokenAmountLoading[] {
  const { account } = useActiveWeb3React()

  const validatedTokenAddresses = useMemo(() => tokens?.map(token => token?.address) ?? [], [tokens])
  const balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20_ABI, 'balanceOf', [account])
  return useMemo(
    () =>
      balances.map((balanceCall, i) => {
        const raw = balanceCall.result?.[0]
        const amount =
          raw !== undefined && tokens?.[i] ? TokenAmount.fromRawAmount(tokens[i], raw.toString()) : undefined
        return [amount, balanceCall.loading]
      }),
    [balances, tokens],
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  tokenParams?: Token[],
  customChain?: ChainId,
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const { account, chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  // Issue the calls in address order, de-duplicated: wagmi keys the multicall query on the contracts
  // array, so a caller that re-orders its token list (the token selector re-sorts its rows as balances
  // land) re-keys the query and refetches every chunk. The result is an address map, so the order the
  // calls go out in is invisible to callers.
  const tokens = useMemo(() => {
    if (tokenParams?.[0]?.chainId !== chainId) return EMPTY_ARRAY as Token[]
    const seen = new Set<string>()
    return tokenParams
      .filter(token => {
        if (!token || seen.has(token.address)) return false
        seen.add(token.address)
        return true
      })
      .sort((tokenA, tokenB) => (tokenA.address < tokenB.address ? -1 : tokenA.address > tokenB.address ? 1 : 0))
  }, [tokenParams, chainId])

  const isFetchOtherChain = chainId !== currentChain

  const balancesCurrentChain = useTokensBalance(isFetchOtherChain ? EMPTY_ARRAY : tokens)

  const [balancesOtherChain, isLoadingAnotherChain] = useTokensBalanceOfAnotherChain(
    chainId,
    isFetchOtherChain ? tokens : EMPTY_ARRAY,
  )

  const balances = isFetchOtherChain ? balancesOtherChain : balancesCurrentChain

  const anyLoading: boolean = useMemo(
    () => (isFetchOtherChain ? isLoadingAnotherChain : balances.some(balanceCall => balanceCall[1])),
    [balances, isFetchOtherChain, isLoadingAnotherChain],
  )

  const balanceResult: { [key: string]: TokenAmount } = useMemo(
    () =>
      account && tokens && tokens.length > 0
        ? tokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
            const amount = balances?.[i]?.[0]?.currency.equals(token) ? balances?.[i]?.[0] : undefined

            if (amount) {
              memo[token.address] = amount
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

export function useTokenBalances(
  tokens?: Token[],
  customChain?: ChainId,
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(tokens, customChain)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(token?: Token): TokenAmount | undefined {
  const param = useMemo(() => token && [token], [token])
  const tokenBalances = useTokenBalances(param)
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  currencies?: (Currency | undefined)[],
  customChain?: ChainId,
): CurrencyAmount<Currency>[] {
  const { account, chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const tokens: Token[] = useMemo(() => {
    const result = currencies?.filter((currency): currency is Token => !!currency && !isTokenNative(currency))
    return result?.length ? result : (EMPTY_ARRAY as Token[])
  }, [currencies])

  const tokenBalances = useTokenBalances(tokens, chainId)
  const ethBalance = useNativeBalance(chainId)

  // The tokens a form transacts with are the ones the wallet inventory is most likely to be behind on
  // right after a transaction; hand it these per-block reads so it can correct itself meanwhile.
  const blockNumber = useBlockNumberFor(chainId)
  useEffect(() => {
    if (!account || chainId !== currentChain || blockNumber === undefined) return
    const reads = tokens.flatMap(token => {
      const amount = tokenBalances[token.address]
      return amount ? [{ address: token.address, rawBalance: BigInt(amount.quotient.toString()) }] : []
    })
    publishLiveBalances(chainId, account, blockNumber, reads)
  }, [account, chainId, currentChain, blockNumber, tokens, tokenBalances])
  // The reads go with the tokens: once this form stops reading a token, its last read must not
  // linger and outlive the balance it described.
  useEffect(() => {
    if (!account || chainId !== currentChain) return
    const addresses = tokens.map(token => token.address)
    return () => retireLiveBalances(chainId, account, addresses)
  }, [account, chainId, currentChain, tokens])

  return useMemo(
    () =>
      currencies?.map(currency => {
        if (!account || !currency) return undefined
        if (isTokenNative(currency)) return ethBalance
        return tokenBalances[(currency as Token).address]
      }) ?? EMPTY_ARRAY,
    [account, currencies, ethBalance, tokenBalances],
  )
}

export function useCurrencyBalance(currency?: Currency, chainId?: ChainId): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    useMemo(() => [currency], [currency]),
    chainId,
  )[0]
}

// mimics useAllBalances
// `enabled=false` skips registering the per-block balanceOf multicall over the whole token map (for
// callers that only need it on some tabs) while keeping the return shape stable.
export function useAllTokenBalances(
  chainId?: ChainId,
  enabled = true,
): { [tokenAddress: string]: TokenAmount | undefined } {
  const allTokens = useAllTokens(false, chainId)
  const allTokensArray = useMemo(
    () => (enabled ? Object.values(allTokens ?? {}) : (EMPTY_ARRAY as Token[])),
    [allTokens, enabled],
  )
  return useTokenBalances(allTokensArray, chainId) ?? EMPTY_OBJECT
}

// return list token has balance
// `enabled=false` skips the per-block balanceOf multicall over the whole token map (for callers that
// have another balance source) while keeping the return shape stable.
export const useTokensHasBalance = (includesImportToken = false, enabled = true) => {
  const { chainId } = useActiveWeb3React()
  const whitelistTokens = useAllTokens()

  const currencies: Token[] = useMemo(
    () => (enabled ? Object.values(whitelistTokens) : (EMPTY_ARRAY as Token[])),
    [whitelistTokens, enabled],
  )
  const [currencyBalances, loadingBalance] = useTokenBalancesWithLoadingIndicator(currencies)

  const ethBalance = useNativeBalance()

  const [tokensHasBalance, setTokensHasBalance] = useState<Currency[]>([])
  const tokensHasBalanceAddresses = useMemo(() => tokensHasBalance.map(e => e.wrapped.address), [tokensHasBalance])

  useEffect(() => {
    // Disabled means another source owns this surface: hold no list at all, so nothing here
    // subscribes to prices and the null total-guard below still holds when the hook is re-enabled.
    if (!enabled) {
      setTokensHasBalance(EMPTY_ARRAY as Currency[])
      return
    }
    if (!loadingBalance && ethBalance) {
      // call once per chain
      const list: Currency[] = currencies.filter(currency => {
        if (isTokenNative(currency)) return false
        const hasBalance = !currencyBalances[currency.wrapped.address]?.equalTo(
          CurrencyAmount.fromRawAmount(currency, '0'),
        )
        return includesImportToken && !(currency as WrappedTokenInfo).isWhitelisted ? true : hasBalance
      })
      if (!ethBalance.equalTo(CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], '0'))) {
        list.push(NativeCurrencies[chainId])
      }
      setTokensHasBalance(list)
    }
  }, [enabled, loadingBalance, currencies, currencyBalances, ethBalance, chainId, includesImportToken])

  const tokensPrices = useTokenPrices(tokensHasBalanceAddresses)

  const totalBalanceInUsd = useMemo(() => {
    if (loadingBalance && !tokensHasBalance.length) return null
    return tokensHasBalance.reduce((total, token) => {
      const balance = currencyBalances[token.wrapped.address]
      if (!balance || !ethBalance) return total
      const usdPrice = tokensPrices[balance.currency.wrapped.address] ?? 0
      const tokenBalance = token.isNative ? ethBalance.toExact() : balance.toExact()
      return total + parseFloat(tokenBalance) * usdPrice
    }, 0)
  }, [tokensPrices, loadingBalance, tokensHasBalance, currencyBalances, ethBalance])

  // sort by usd
  const tokensHasBalanceSorted = useMemo(() => {
    // Copy before sorting: `tokensHasBalance` is React state, and sorting it in place mutates the
    // value other memos in this hook are already holding.
    return [...(tokensHasBalance as Token[])].sort((a, b) => {
      const addressA = a.wrapped.address
      const addressB = b.wrapped.address

      const usdPriceA = tokensPrices[addressA] ?? 0
      const usdPriceB = tokensPrices[addressB] ?? 0

      const tokenBalanceA = a.isNative ? ethBalance?.toExact() : currencyBalances[addressA]?.toExact()
      const tokenBalanceB = b.isNative ? ethBalance?.toExact() : currencyBalances[addressB]?.toExact()

      const usdA = parseFloat(tokenBalanceA ?? '0') * usdPriceA
      const usdB = parseFloat(tokenBalanceB ?? '0') * usdPriceB
      // Return 0 on a tie: an always-nonzero comparator is inconsistent, so equal-value rows would
      // shuffle on every re-sort.
      return usdB - usdA
    })
  }, [tokensHasBalance, tokensPrices, currencyBalances, ethBalance])

  return {
    loading: loadingBalance,
    totalBalanceInUsd,
    currencies: tokensHasBalanceSorted,
    currencyBalances,
    usdBalances: tokensPrices,
  }
}
