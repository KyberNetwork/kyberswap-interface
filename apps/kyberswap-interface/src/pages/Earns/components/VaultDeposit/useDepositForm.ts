import { NATIVE_TOKEN_ADDRESS, Token as TokenSchema } from '@kyber/schema'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCheckAllowance } from 'hooks/useCheckAllowance'
import { useVaultDeposit } from 'pages/Earns/VaultDetail/hooks/useVaultDeposit'
import useDefaultDepositToken from 'pages/Earns/components/VaultDeposit/useDefaultDepositToken'
import { VAULT_ACTION_STEP, VAULT_APPROVE_STEP, VaultStep } from 'pages/Earns/components/vaultSteps'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

/** Basis points. Covers the vault's rate drift between quoting and mining. */
export const DEFAULT_SLIPPAGE_BPS = 50

export const PERCENT_OPTIONS = [25, 50, 75, 100] as const

/**
 * Everything the deposit form needs, so the panel on the vault page and the modal opened from a
 * vault card behave identically.
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

  const [currency, setCurrency] = useState<Currency | undefined>(undefined)
  // The selector already knows each token's logo; an SDK currency built from an address does not.
  const [currencyLogo, setCurrencyLogo] = useState<string | undefined>(undefined)
  const [typedValue, setTypedValue] = useState('')
  const [percent, setPercent] = useState<number | undefined>(undefined)
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE_BPS)

  const { token: defaultToken, isReady: isDefaultTokenReady } = useDefaultDepositToken({
    chainId,
    vaultId: vault.vaultId,
    underlyingAddress: vault.underlyingToken?.address,
  })

  // The opening token is chosen once, after the candidate balances have been read. `hasPickedRef`
  // keeps a late balance from moving the selection out from under someone already filling the form.
  const hasPickedRef = useRef(false)
  useEffect(() => {
    hasPickedRef.current = false
    setCurrency(undefined)
    setCurrencyLogo(undefined)
    setTypedValue('')
    setPercent(undefined)
  }, [chainId, vault.vaultId])

  useEffect(() => {
    if (hasPickedRef.current || !isDefaultTokenReady) return
    hasPickedRef.current = true
    setCurrency(defaultToken)
  }, [isDefaultTokenReady, defaultToken])

  const balance = useCurrencyBalance(currency, chainId)
  const parsedAmount = useMemo(() => tryParseAmount(typedValue, currency), [typedValue, currency])

  const deposit = useVaultDeposit({
    chainId,
    shareTokenAddress: vault.shareToken?.address,
    shareTokenSymbol: vault.shareToken?.symbol,
    shareTokenDecimals: vault.shareToken?.decimals ?? 18,
    currency,
    parsedAmount,
    slippage,
    pausePolling,
  })

  // The sequence keeps running after the transaction is broadcast, and it reads the amount to
  // build a retry, so the form is only emptied once the run is over.
  const resetAmount = useCallback(() => {
    setTypedValue('')
    setPercent(undefined)
  }, [])

  const onTypeAmount = useCallback((value: string) => {
    const next = value.replace(/,/g, '.')
    if (next !== '' && !/^\d*\.?\d*$/.test(next)) return
    setTypedValue(next)
    setPercent(undefined)
  }, [])

  const onSelectPercent = useCallback(
    (value: number) => {
      if (!balance) return
      // Native deposits keep a slice back for gas — the aggregator call is not cheap.
      const usable = currency?.isNative && value === 100 ? balance.multiply(99).divide(100) : balance
      setTypedValue(usable.multiply(value).divide(100).toExact())
      setPercent(value)
    },
    [balance, currency?.isNative],
  )

  // The token selector speaks the schema's plain token shape; balances, parsing and approvals
  // downstream all want an SDK currency.
  const onSelectToken = useCallback(
    (token: TokenSchema) => {
      const isNative = token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      const next = isNative
        ? NativeCurrencies[chainId as keyof typeof NativeCurrencies]
        : new Token(chainId, token.address, token.decimals, token.symbol)
      hasPickedRef.current = true
      setCurrency(next)
      setCurrencyLogo(token.logo || undefined)
      setTypedValue('')
      setPercent(undefined)
    },
    [chainId],
  )

  // Native currency counts as the vault's own asset only when the vault's underlying is the
  // wrapped native — depositing ETH into a USDC vault is still a swap.
  const isVaultAsset = Boolean(
    currency &&
      vault.underlyingToken?.address &&
      currency.wrapped.address.toLowerCase() === vault.underlyingToken.address.toLowerCase(),
  )

  const hasAmount = Boolean(parsedAmount?.greaterThan(0))
  const insufficientBalance = Boolean(parsedAmount && balance && parsedAmount.greaterThan(balance))
  const wrongChain = Boolean(account && chainId && walletChainId !== chainId)
  const isReady = Boolean(
    account &&
      !wrongChain &&
      hasAmount &&
      !insufficientBalance &&
      deposit.route &&
      !deposit.isRouteStale &&
      !deposit.isSubmitting,
  )

  const checkApprovalManually = useCheckAllowance({
    account,
    amount: parsedAmount,
    chainId: chainId as ChainId,
    currency,
    spender: deposit.route?.allowanceHubAddress,
  })

  return {
    account,
    chainId,
    currency,
    currencyLogo,
    typedValue,
    percent,
    slippage,
    setSlippage,
    balance,
    parsedAmount,
    /** True when the chosen token is the vault's own asset, so no swap happens on the way in. */
    isVaultAsset,
    hasAmount,
    insufficientBalance,
    wrongChain,
    isReady,
    onTypeAmount,
    onSelectPercent,
    onSelectToken,
    resetAmount,

    route: deposit.route,
    routeError: deposit.routeError,
    isRouteLoading: deposit.isRouteLoading,
    sharesOutRaw: deposit.sharesOutRaw,
    minSharesOutRaw: deposit.minSharesOutRaw,
    submitError: deposit.submitError,

    /** Fed to `useProcessingSteps` so the confirmation can run approve → deposit in the open. */
    processing: {
      chainId: chainId as number,
      // The approve step re-reads the allowance and skips itself when one is already in place, so
      // it is listed for every token that can have one — the cached state is not accurate enough
      // to leave it out.
      steps: (currency?.isNative ? [VAULT_ACTION_STEP] : [VAULT_APPROVE_STEP, VAULT_ACTION_STEP]) as VaultStep[],
      approveStep: VAULT_APPROVE_STEP,
      actionStep: VAULT_ACTION_STEP,
      approval: deposit.approvalState,
      approveCallback: deposit.approve,
      checkApprovalManually,
      onFinalStep: deposit.deposit,
    },
  }
}

export type DepositFormState = ReturnType<typeof useDepositForm>
