import { useTokenPrices } from '@kyber/hooks'
import { NATIVE_TOKEN_ADDRESS, Token as TokenSchema } from '@kyber/schema'
import { MAX_TOKENS } from '@kyber/token-selector'
import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { VaultDepositInput, useVaultDeposit } from 'pages/Earns/VaultDetail/hooks/useVaultDeposit'
import useDefaultDepositToken from 'pages/Earns/components/VaultDeposit/useDefaultDepositToken'
import { useDepositApprovals } from 'pages/Earns/components/VaultDeposit/useDepositApprovals'
import { VAULT_ACTION_STEP, VaultStep, vaultApproveStep } from 'pages/Earns/components/vaultSteps'
import { useVaultSlippage } from 'pages/Earns/hooks/useVaultSlippage'
import {
  getVaultSlippageNotice,
  getVaultSuggestedSlippage,
  useVaultSlippageAdvice,
} from 'pages/Earns/hooks/useVaultSlippageAdvice'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { checkPriceImpact } from 'utils/prices'
import { formatUnits } from 'utils/viem'

export const PERCENT_OPTIONS = [25, 50, 75, 100] as const

/** One token the form is spending, with what the user has typed against it. */
export type DepositRow = {
  currency: Currency
  // The selector already knows each token's logo; an SDK currency built from an address does not.
  logo?: string
  typedValue: string
  percent?: number
}

const isNativeAddress = (address: string) => address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()

const rowAddress = (currency: Currency) => (currency.isNative ? NATIVE_TOKEN_ADDRESS : currency.wrapped.address)

const toSchemaToken = (row: DepositRow): TokenSchema => ({
  address: rowAddress(row.currency),
  symbol: row.currency.symbol ?? '',
  name: row.currency.name ?? '',
  decimals: row.currency.decimals,
  logo: row.logo,
})

/** Native deposits keep a slice back for gas — the aggregator call is not cheap. */
const spendableBalance = (currency: Currency, balance: CurrencyAmount<Currency>) =>
  currency.isNative ? balance.multiply(99).divide(100) : balance

const toCurrency = (token: TokenSchema, chainId: number): Currency =>
  isNativeAddress(token.address)
    ? NativeCurrencies[chainId as keyof typeof NativeCurrencies]
    : new Token(chainId, token.address, token.decimals, token.symbol)

/**
 * The rows for a token list, keeping whatever each token already has typed against it. A token
 * belongs to one row only: two rows of the same token would share an approval step id, and the step
 * sequence finds a step by value, so the second row would corrupt the run.
 */
export const toRows = (tokens: TokenSchema[], current: DepositRow[], chainId: number): DepositRow[] => {
  const byAddress = new Map(current.map(row => [rowAddress(row.currency).toLowerCase(), row]))
  const taken = new Set<string>()
  const rows: DepositRow[] = []

  tokens.forEach(token => {
    const address = token.address.toLowerCase()
    if (taken.has(address) || rows.length >= MAX_TOKENS) return
    taken.add(address)
    rows.push(
      byAddress.get(address) ?? {
        currency: toCurrency(token, chainId),
        logo: token.logo || undefined,
        typedValue: '',
        percent: undefined,
      },
    )
  })

  return rows
}

/**
 * Everything the deposit form needs, so the panel on the vault page and the modal opened from a
 * vault card behave identically.
 *
 * The aggregator takes several tokens into one output, so the form holds a row per token and the
 * route, the allowances and the step sequence all follow that list.
 */
export const useDepositForm = ({
  vault,
  pausePolling,
}: {
  vault: VaultApiDetailItem
  /** Hold the quote steady while the user is reviewing or signing it. */
  pausePolling?: boolean
}) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const chainId = vault.chain?.id

  const [rows, setRows] = useState<DepositRow[]>([])
  // The tokens the form holds, not the amounts typed against them: adding a token changes which
  // model judges the slippage, typing into one should not.
  const slippageTokensIn = useMemo(() => rows.map(row => row.currency.wrapped.address), [rows])
  const slippageAdvice = useVaultSlippageAdvice({
    chainId,
    tokensIn: slippageTokensIn,
    tokenOut: vault.shareToken?.address,
  })
  const { slippage, setSlippage } = useVaultSlippage({
    chainId,
    vaultId: vault.vaultId,
    scope: 'deposit',
    defaultBps: slippageAdvice.defaultBps,
  })

  const underlyingAddress = vault.underlyingToken?.address
  const shareDecimals = vault.shareToken?.decimals ?? 18

  const { token: defaultToken, isReady: isDefaultTokenReady } = useDefaultDepositToken({
    chainId,
    vaultId: vault.vaultId,
    underlyingAddress,
    shareAddress: vault.shareToken?.address,
  })

  // The opening token is chosen once, after the candidate balances have been read. `hasPickedRef`
  // keeps a late balance from moving the selection out from under someone already filling the form.
  const hasPickedRef = useRef(false)
  useEffect(() => {
    hasPickedRef.current = false
    setRows([])
  }, [chainId, vault.vaultId])

  useEffect(() => {
    if (hasPickedRef.current || !isDefaultTokenReady) return
    hasPickedRef.current = true
    setRows(defaultToken ? [{ currency: defaultToken, typedValue: '' }] : [])
  }, [isDefaultTokenReady, defaultToken])

  const currencies = useMemo(() => rows.map(row => row.currency), [rows])
  const balances = useCurrencyBalances(currencies, chainId)

  /**
   * The form opens with an amount already in it, the way the zap flows do: one whole token when the
   * wallet holds at least that much, otherwise all of it — less the slice a native deposit keeps
   * back for gas. A wallet holding none of the opening token is left blank rather than handed an
   * amount it cannot cover. Seeded once, so it never lands on top of what someone is typing.
   */
  const hasSeededAmountRef = useRef(false)
  useEffect(() => {
    hasSeededAmountRef.current = false
  }, [chainId, vault.vaultId])

  useEffect(() => {
    if (hasSeededAmountRef.current || rows.length !== 1 || rows[0].typedValue) return
    const balance = balances[0]
    if (!balance) return
    hasSeededAmountRef.current = true
    if (!balance.greaterThan(0)) return

    const one = tryParseAmount('1', rows[0].currency)
    const spendable = spendableBalance(rows[0].currency, balance)
    const typedValue = one && !spendable.lessThan(one) ? '1' : spendable.toExact()
    setRows(current => (current.length === 1 && !current[0].typedValue ? [{ ...current[0], typedValue }] : current))
  }, [rows, balances])
  const parsedAmounts = useMemo(
    () => rows.map(row => tryParseAmount(row.typedValue, row.currency)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows],
  )

  /** The rows the route actually spends: a row with nothing typed into it is not one of them. */
  const inputs = useMemo<VaultDepositInput[]>(
    () =>
      rows
        .map((row, index) => ({ currency: row.currency, parsedAmount: parsedAmounts[index] }))
        .filter((input): input is VaultDepositInput => Boolean(input.parsedAmount?.greaterThan(0))),
    [rows, parsedAmounts],
  )

  const deposit = useVaultDeposit({
    chainId,
    shareTokenAddress: vault.shareToken?.address,
    shareTokenSymbol: vault.shareToken?.symbol,
    shareTokenDecimals: shareDecimals,
    inputs,
    slippage,
    pausePolling,
  })

  const approvals = useDepositApprovals({
    inputs,
    spender: deposit.route?.allowanceHubAddress,
    chainId: chainId as ChainId,
    account,
  })

  /**
   * Names the token behind each approval step. Read from the rows rather than from the amounts
   * being spent, so the labels survive the reset that empties the form once a deposit lands.
   */
  const approveSymbols = useMemo(() => {
    const symbols: Record<string, string> = {}
    rows.forEach(row => {
      if (row.currency.isNative) return
      symbols[vaultApproveStep(row.currency.wrapped.address)] = row.currency.symbol ?? ''
    })
    return symbols
  }, [rows])

  /** What each token is worth on the way in, as the route priced it. */
  const usdByAddress = useMemo(() => {
    const totals: Record<string, number> = {}
    deposit.route?.zapDetails.actions.forEach(action =>
      action.aggregatorSwap?.swaps.forEach(swap => {
        const key = swap.tokenIn.address.toLowerCase()
        const usd = Number(swap.tokenIn.amountUsd)
        if (Number.isFinite(usd)) totals[key] = (totals[key] ?? 0) + usd
      }),
    )
    return totals
  }, [deposit.route])

  const { prices } = useTokenPrices({
    addresses: underlyingAddress ? [underlyingAddress] : [],
    chainId,
  })

  /**
   * Shares per unit of the vault's underlying, which is the pairing the vault is quoted in whatever
   * mix of tokens is being spent. Both sides are taken through USD: the route prices the shares it
   * delivers, and the price feed prices the underlying.
   */
  const exchangeRate = useMemo(() => {
    if (!deposit.route || !deposit.sharesOutRaw || !underlyingAddress) return undefined
    const sharesOut = Number(formatUnits(deposit.sharesOutRaw, shareDecimals))
    const finalUsd = Number(deposit.route.zapDetails.finalAmountUsd)
    const underlyingPrice = prices[underlyingAddress.toLowerCase()]
    if (!sharesOut || !Number.isFinite(finalUsd) || !underlyingPrice) return undefined
    const usdPerShare = finalUsd / sharesOut
    return usdPerShare > 0 ? underlyingPrice / usdPerShare : undefined
  }, [deposit.route, deposit.sharesOutRaw, shareDecimals, underlyingAddress, prices])

  /** Per-row state for the UI: balance, what it is worth, and whether it overdraws the wallet. */
  const rowStates = useMemo(
    () =>
      rows.map((row, index) => {
        const balance = balances[index]
        const parsedAmount = parsedAmounts[index]
        const address = rowAddress(row.currency).toLowerCase()
        return {
          key: address,
          currency: row.currency,
          logo: row.logo,
          typedValue: row.typedValue,
          percent: row.percent,
          balance,
          parsedAmount,
          amountUsd:
            usdByAddress[address] ??
            (row.currency.isNative ? usdByAddress[row.currency.wrapped.address.toLowerCase()] : undefined),
          insufficientBalance: Boolean(parsedAmount && balance && parsedAmount.greaterThan(balance)),
        }
      }),
    [rows, balances, parsedAmounts, usdByAddress],
  )

  // The sequence keeps running after the transaction is broadcast, and it reads the amounts to
  // build a retry, so the form is only emptied once the run is over.
  const resetAmount = useCallback(() => {
    setRows(current => current.map(row => ({ ...row, typedValue: '', percent: undefined })))
  }, [])

  const onTypeAmount = useCallback((index: number, value: string) => {
    const next = value.replace(/,/g, '.')
    if (next !== '' && !/^\d*\.?\d*$/.test(next)) return
    setRows(current => current.map((row, i) => (i === index ? { ...row, typedValue: next, percent: undefined } : row)))
  }, [])

  const onSelectPercent = useCallback(
    (index: number, value: number) => {
      const balance = balances[index]
      if (!balance) return
      const row = rows[index]
      const usable = row && value === 100 ? spendableBalance(row.currency, balance) : balance
      const typedValue = usable.multiply(value).divide(100).toExact()
      setRows(current => current.map((item, i) => (i === index ? { ...item, typedValue, percent: value } : item)))
    },
    [balances, rows],
  )

  const onRemoveRow = useCallback((index: number) => {
    setRows(current => (current.length > 1 ? current.filter((_, i) => i !== index) : current))
  }, [])

  /** The selector's own list, after the user has added or removed tokens in it. */
  const onTokensChange = useCallback(
    (tokens: TokenSchema[]) => {
      if (!chainId) return
      hasPickedRef.current = true
      setRows(current => toRows(tokens, current, chainId))
    },
    [chainId],
  )

  const selectorTokens = useMemo(() => rows.map(toSchemaToken), [rows])
  const selectorAmounts = useMemo(() => rows.map(row => row.typedValue).join(','), [rows])

  // Native currency counts as the vault's own asset only when the vault's underlying is the
  // wrapped native — depositing ETH into a USDC vault is still a swap.
  const isVaultAsset = Boolean(
    underlyingAddress &&
      inputs.length > 0 &&
      inputs.every(input => input.currency.wrapped.address.toLowerCase() === underlyingAddress.toLowerCase()),
  )

  const hasAmount = inputs.length > 0
  const insufficientBalance = rowStates.some(row => row.insufficientBalance)
  // A balance that has not been read yet cannot be shown to cover the amount.
  const hasAllBalances = rowStates.every(row => !row.parsedAmount?.greaterThan(0) || Boolean(row.balance))
  const wrongChain = Boolean(account && chainId && walletChainId !== chainId)
  const chainName = vault.chain?.name ?? ''

  /**
   * What the button has to say while the form cannot be acted on, or nothing when it can. It lives
   * here because every branch reads state this hook owns; the wording for a form that IS actionable
   * is the caller's, since the page names the token it is spending and the modal has no room to.
   */
  const actionBlocker = !account
    ? t`Connect Wallet`
    : wrongChain
    ? t`Switch to ${chainName}`
    : !hasAmount
    ? t`Enter an amount`
    : insufficientBalance
    ? t`Insufficient balance`
    : deposit.isRouteLoading && !deposit.route
    ? t`Finding best route`
    : deposit.routeError
    ? t`No route found`
    : undefined

  const isReady = Boolean(
    account &&
      !wrongChain &&
      hasAmount &&
      hasAllBalances &&
      !insufficientBalance &&
      deposit.route &&
      !deposit.routeError &&
      !deposit.isRouteStale &&
      !deposit.isSubmitting,
  )

  /**
   * How far the route moves the price, judged on the same thresholds the swap form uses. The vault
   * has no degen mode to switch off the guard, so a bad route is flagged and relabelled rather than
   * blocked outright — the way the zap flows do it.
   */
  const priceImpact = deposit.route?.zapDetails.priceImpact
  const priceImpactResult = checkPriceImpact(priceImpact)

  const totalUsd = deposit.route ? Number(deposit.route.zapDetails.initialAmountUsd) : undefined

  return {
    account,
    chainId,
    rows: rowStates,
    /** No token is on the form yet: the opening pick is still reading the candidates' balances. */
    isInitialising: rows.length === 0 && !isDefaultTokenReady,
    canAddToken: rows.length < MAX_TOKENS,
    selectorTokens,
    selectorAmounts,
    slippage,
    setSlippage,
    totalUsd,
    exchangeRate,
    /** True when every token being spent is the vault's own asset, so no swap happens on the way in. */
    isVaultAsset,
    hasAmount,
    insufficientBalance,
    wrongChain,
    isReady,
    actionBlocker,
    onTypeAmount,
    onSelectPercent,
    onTokensChange,
    onRemoveRow,
    resetAmount,

    route: deposit.route,
    routeError: deposit.routeError,
    priceImpact,
    priceImpactResult,
    isSlippageResolving: slippageAdvice.isResolving,
    slippageNotice: getVaultSlippageNotice(slippageAdvice, slippage, deposit.route?.zapDetails.suggestedSlippage),
    suggestedSlippage: getVaultSuggestedSlippage(slippageAdvice, deposit.route?.zapDetails.suggestedSlippage),
    isRouteLoading: deposit.isRouteLoading,
    sharesOutRaw: deposit.sharesOutRaw,
    minSharesOutRaw: deposit.minSharesOutRaw,
    submitError: deposit.submitError,

    /** Fed to `useProcessingSteps` so the confirmation can run approve → … → deposit in the open. */
    processing: {
      chainId: chainId as number,
      // An approve step per token that has one, then the deposit itself. Each step re-reads its
      // allowance and skips itself when one is already in place, so every token is listed.
      steps: [...approvals.map(entry => entry.step), VAULT_ACTION_STEP] as VaultStep[],
      approvals,
      approveSymbols,
      actionStep: VAULT_ACTION_STEP,
      onFinalStep: deposit.deposit,
    },
  }
}

export type DepositFormState = ReturnType<typeof useDepositForm>
