import { NATIVE_TOKEN_ADDRESS, Token as TokenSchema } from '@kyber/schema'
import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VaultApiDetailItem, VaultPositionItem, useVaultSupportedAssetsQuery } from 'services/vault'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCheckAllowance } from 'hooks/useCheckAllowance'
import { useVaultWithdraw } from 'pages/Earns/VaultDetail/hooks/useVaultWithdraw'
import { useWithdrawPreview } from 'pages/Earns/VaultDetail/hooks/useWithdrawQueue'
import { getVaultPriceImpact } from 'pages/Earns/components/VaultPriceImpactNote'
import { VAULT_ACTION_STEP, VAULT_APPROVE_STEP, VaultStep } from 'pages/Earns/components/vaultSteps'
import { useVaultSlippage } from 'pages/Earns/hooks/useVaultSlippage'
import {
  getVaultSlippageNotice,
  getVaultSuggestedSlippage,
  useVaultSlippageAdvice,
} from 'pages/Earns/hooks/useVaultSlippageAdvice'
import { useZapSwap } from 'pages/Earns/hooks/useZapSwap'
import { isWrappedNativeToken } from 'pages/Earns/utils'
import { getBoringQueueRoute, safeBigInt } from 'pages/Earns/utils/vault'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getNativeTokenLogo } from 'utils/tokenLogo'
import { formatUnits, parseUnits } from 'utils/viem'

export enum WithdrawMode {
  /** Sell the shares through the aggregator; settles in one transaction. */
  ANY_TOKEN = 'any',
  /** Queue a redemption with the vault; the solver delivers the asset later. */
  NATIVE = 'native',
}

export const PERCENT_OPTIONS = [25, 50, 75, 100] as const

export const useWithdrawForm = ({
  vault,
  position,
  pausePolling,
}: {
  vault: VaultApiDetailItem
  position?: VaultPositionItem
  /** Hold the quote steady while the user is reviewing or signing it. */
  pausePolling?: boolean
}) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()

  const chainId = vault.chain?.id
  const shareDecimals = vault.shareToken?.decimals ?? 18
  const shareSymbol = vault.shareToken?.symbol ?? ''

  // Undecided until the routes are known; `effectiveMode` picks the tab to open on.
  const [mode, setMode] = useState<WithdrawMode | undefined>(undefined)
  const [typedValue, setTypedValue] = useState('')
  const [percent, setPercent] = useState<number | undefined>(undefined)
  /** The token the aggregator sells the shares into, on the any-token path. */
  const [swapToken, setSwapToken] = useState<TokenSchema | undefined>(undefined)

  // A withdrawal always spends one token — the shares — so it is always read on the swap model.
  const slippageAdvice = useVaultSlippageAdvice({
    chainId,
    tokensIn: vault.shareToken?.address ? [vault.shareToken.address] : [],
    tokenOut: swapToken?.address,
  })
  const { slippage, setSlippage } = useVaultSlippage({
    chainId,
    vaultId: vault.vaultId,
    scope: 'withdraw',
    defaultBps: slippageAdvice.defaultBps,
  })

  const shareToken = useMemo(
    () =>
      chainId && vault.shareToken?.address
        ? new Token(chainId, vault.shareToken.address, shareDecimals, shareSymbol, vault.name)
        : undefined,
    [chainId, vault.shareToken?.address, vault.name, shareDecimals, shareSymbol],
  )

  const shareBalanceRaw = safeBigInt(position?.shareBalanceRaw)

  const shares = useMemo(() => {
    if (!typedValue) return undefined
    try {
      const parsed = parseUnits(typedValue, shareDecimals)
      return parsed > 0n ? parsed : undefined
    } catch {
      return undefined
    }
  }, [typedValue, shareDecimals])

  const approvalAmount = useMemo<CurrencyAmount<Token> | undefined>(
    () => (shareToken && shares ? CurrencyAmount.fromRawAmount(shareToken, shares.toString()) : undefined),
    [shareToken, shares],
  )

  // ---- native path: the queue decides which assets it accepts and on what terms ----
  const { data: supportedAssets, isLoading: isLoadingAssets } = useVaultSupportedAssetsQuery(
    { chainId, vaultId: vault.vaultId },
    { skip: !chainId || !vault.vaultId },
  )

  const withdrawableAssets = useMemo(
    () => (supportedAssets || []).filter(asset => asset.supportsWithdraw && asset.isActive),
    [supportedAssets],
  )

  const [nativeAssetAddress, setNativeAssetAddress] = useState<string | undefined>(undefined)
  useEffect(() => {
    setNativeAssetAddress(current => current ?? withdrawableAssets[0]?.assetAddress)
  }, [withdrawableAssets])

  const nativeAsset = withdrawableAssets.find(asset => asset.assetAddress === nativeAssetAddress)

  // The queue that takes this asset, and the terms it enforces. Both come from the route rather
  // than the vault: an asset the vault lists is not necessarily one its queue is open for.
  const queueRoute = getBoringQueueRoute(nativeAsset)
  const queueAddress = queueRoute?.queueAddress
  const queueLimits = queueRoute?.limits ?? undefined
  const hasNativeRoute = withdrawableAssets.some(asset => getBoringQueueRoute(asset))

  // Native is the vault's own exit, so it stays selected while the routes are still loading.
  const effectiveMode = mode ?? (isLoadingAssets || hasNativeRoute ? WithdrawMode.NATIVE : WithdrawMode.ANY_TOKEN)
  const isNative = effectiveMode === WithdrawMode.NATIVE

  const { amountOut: nativeAmountOut, isLoading: isLoadingPreview } = useWithdrawPreview({
    chainId,
    queueAddress,
    assetOut: nativeAssetAddress,
    shares,
    discount: queueLimits?.minDiscount,
    enabled: isNative,
  })

  const nativeWithdraw = useVaultWithdraw({
    chainId,
    queueAddress,
    shareToken,
    shares,
    assetOut: nativeAssetAddress,
    discount: queueLimits?.minDiscount,
    secondsToDeadline: queueLimits?.minimumSecondsToDeadline,
  })

  // ---- any-token path: the aggregator sells the shares outright ----

  /**
   * Opens on the vault's own asset, except that a vault accounting in the chain's wrapped native
   * opens on the native asset itself: the wrapper is how the vault keeps its books, not what someone
   * wants handed back. The API's token shape has no `name`, which the selector's does.
   */
  useEffect(() => {
    const underlying = vault.underlyingToken
    if (!underlying?.address || !chainId) return

    const native = NativeCurrencies[chainId as ChainId]
    const opensOnNative = native && isWrappedNativeToken(underlying.address, chainId as keyof typeof WETH)

    setSwapToken(
      current =>
        current ??
        (opensOnNative
          ? {
              address: NATIVE_TOKEN_ADDRESS,
              symbol: native.symbol ?? '',
              name: native.name ?? native.symbol ?? '',
              decimals: native.decimals,
              logo: getNativeTokenLogo(chainId as ChainId),
            }
          : {
              address: underlying.address,
              symbol: underlying.symbol,
              name: underlying.symbol,
              decimals: underlying.decimals,
              logo: underlying.logo,
            }),
    )
  }, [vault.underlyingToken, chainId])

  const zapExtraInfo = useCallback(
    (quoteAmountOutRaw: string) => ({
      tokenAmountIn: shares ? formatUnits(shares, shareDecimals) : '',
      tokenAmountOut: formatUnits(safeBigInt(quoteAmountOutRaw), swapToken?.decimals ?? 18),
      tokenSymbolIn: shareSymbol,
      tokenAddressIn: vault.shareToken?.address ?? '',
      tokenSymbolOut: swapToken?.symbol ?? '',
      tokenAddressOut: swapToken?.address ?? '',
    }),
    [shares, shareDecimals, shareSymbol, vault.shareToken?.address, swapToken],
  )

  const zapWithdraw = useZapSwap({
    chainId,
    // `effectiveMode`, not `mode`: a vault with no queue route opens on the any-token tab without
    // anyone having tapped it, and that tab is useless without a route behind it.
    tokensIn:
      !isNative && vault.shareToken?.address && shares
        ? [{ address: vault.shareToken.address, amountRaw: shares.toString() }]
        : undefined,
    tokenOutAddress: swapToken?.address,
    approvalAmount,
    slippage,
    transactionType: TRANSACTION_TYPE.EARN_VAULT_WITHDRAW,
    errorTitle: t`Withdrawal failed`,
    buildExtraInfo: zapExtraInfo,
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
      if (shareBalanceRaw <= 0n) return
      setTypedValue(formatUnits((shareBalanceRaw * BigInt(value)) / 100n, shareDecimals))
      setPercent(value)
    },
    [shareBalanceRaw, shareDecimals],
  )

  const onSelectMode = useCallback((next: WithdrawMode) => {
    setMode(next)
    setPercent(undefined)
  }, [])

  /**
   * The form opens on the whole position, which is what the 100% pill would do: a withdrawal is
   * about a stake someone already holds, so no smaller amount is a better guess. Seeded once, so it
   * neither lands on top of what someone is typing nor refills the form a finished run emptied.
   */
  const hasSeededAmountRef = useRef(false)
  useEffect(() => {
    hasSeededAmountRef.current = false
  }, [chainId, vault.vaultId])

  useEffect(() => {
    if (hasSeededAmountRef.current || typedValue || shareBalanceRaw <= 0n) return
    hasSeededAmountRef.current = true
    onSelectPercent(100)
  }, [typedValue, shareBalanceRaw, onSelectPercent])

  /**
   * What the shares and the payout are worth. The queue path is quoted by the vault rather than by a
   * route, so nothing on it carries a dollar figure; the price feed supplies one for both sides.
   */
  const priceAddresses = useMemo(
    () =>
      [vault.shareToken?.address, nativeAsset?.assetAddress, swapToken?.address]
        .filter((address): address is string => !!address)
        .map(address => address.toLowerCase()),
    [vault.shareToken?.address, nativeAsset?.assetAddress, swapToken?.address],
  )
  const prices = useTokenPrices(priceAddresses, chainId as ChainId)

  const sharesUsd = useMemo(() => {
    // A quoted route has priced the very shares it is about to spend; prefer its figure to a feed.
    if (!isNative && zapWithdraw.route) return Number(zapWithdraw.route.zapDetails.initialAmountUsd) || undefined
    const price = vault.shareToken?.address ? prices[vault.shareToken.address.toLowerCase()] : undefined
    const amount = Number(typedValue)
    return price && Number.isFinite(amount) && amount > 0 ? amount * price : undefined
  }, [isNative, zapWithdraw.route, prices, vault.shareToken?.address, typedValue])

  const minReceivedUsd = useMemo(() => {
    if (isNative) {
      const price = nativeAsset ? prices[nativeAsset.assetAddress.toLowerCase()] : undefined
      return price !== undefined && nativeAmountOut !== undefined
        ? Number(formatUnits(nativeAmountOut, nativeAsset?.decimals ?? 18)) * price
        : undefined
    }
    // The route prices what it delivers, not the floor; the floor's worth follows the same ratio.
    return zapWithdraw.route && zapWithdraw.minAmountOutRaw !== undefined && zapWithdraw.amountOutRaw
      ? (Number(zapWithdraw.route.zapDetails.finalAmountUsd) * Number(zapWithdraw.minAmountOutRaw)) /
          Number(zapWithdraw.amountOutRaw)
      : undefined
  }, [
    isNative,
    nativeAsset,
    prices,
    nativeAmountOut,
    zapWithdraw.route,
    zapWithdraw.minAmountOutRaw,
    zapWithdraw.amountOutRaw,
  ])

  /**
   * Only the aggregator route moves a price. The queue path quotes no route, so it has no reading at
   * all — feeding its absent figure to the zap helper would answer "unable to calculate" and colour
   * a redemption that never touched a pool.
   */
  const zapPriceImpact = isNative ? undefined : zapWithdraw.route?.zapDetails.priceImpact
  const zapPriceImpactResult = !isNative && zapWithdraw.route ? getVaultPriceImpact(zapPriceImpact) : undefined

  const active = isNative ? nativeWithdraw : zapWithdraw

  const minimumShares = safeBigInt(queueLimits?.minimumShares)
  const insufficientShares = Boolean(shares && shares > shareBalanceRaw)
  const belowMinimum = Boolean(isNative && shares && minimumShares > 0n && shares < minimumShares)
  const assetUnavailable = Boolean(isNative && !isLoadingAssets && nativeAsset && !queueRoute)
  const noWithdrawableAsset = isNative && !isLoadingAssets && withdrawableAssets.length === 0
  const missingQueue = isNative && !isLoadingAssets && !hasNativeRoute
  const wrongChain = Boolean(account && chainId && walletChainId !== chainId)

  const blocked = missingQueue || noWithdrawableAsset || assetUnavailable
  const isReady = Boolean(
    account &&
      !wrongChain &&
      shares &&
      !insufficientShares &&
      !belowMinimum &&
      !blocked &&
      !active.isSubmitting &&
      (isNative
        ? // The queue's terms are arguments to the request; without them there is nothing to submit.
          Boolean(queueAddress && queueLimits) && !isLoadingAssets
        : Boolean(zapWithdraw.route) && !zapWithdraw.routeError && !zapWithdraw.isRouteStale),
  )

  const chainName = vault.chain?.name ?? ''

  /**
   * What the button has to say while the form cannot be acted on, or nothing when it can. It lives
   * here because every branch reads state this hook owns; the wording for a form that IS actionable
   * stays with the caller.
   */
  const actionBlocker = !account
    ? t`Connect Wallet`
    : wrongChain
    ? t`Switch to ${chainName}`
    : !shares
    ? t`Enter an amount`
    : insufficientShares
    ? t`Insufficient balance`
    : belowMinimum
    ? t`Amount below the queue minimum`
    : !isNative && zapWithdraw.isRouteLoading && !zapWithdraw.route
    ? t`Finding best route`
    : !isNative && zapWithdraw.routeError
    ? t`No route found`
    : undefined

  /** A condition the form cannot get past, spelled out. The button names the rest. */
  const nativeAssetSymbol = nativeAsset?.symbol ?? ''
  const blockingError = missingQueue
    ? t`Withdrawals are unavailable for this vault right now.`
    : noWithdrawableAsset
    ? t`No asset can be withdrawn from this vault right now.`
    : assetUnavailable
    ? t`${nativeAssetSymbol} cannot be withdrawn from this vault.`
    : !isNative && zapWithdraw.routeError && shares
    ? zapWithdraw.routeError
    : undefined

  // The queue pulls the shares for a native redemption; the router pulls them for a market sale.
  const checkApprovalManually = useCheckAllowance({
    account,
    amount: approvalAmount,
    chainId: chainId as ChainId,
    currency: shareToken,
    spender: isNative ? queueAddress : zapWithdraw.route?.allowanceHubAddress,
  })

  return {
    account,
    chainId,
    mode: effectiveMode,
    isNative,
    onSelectMode,
    typedValue,
    percent,
    slippage,
    setSlippage,
    shares,
    shareToken,
    shareSymbol,
    shareDecimals,
    shareBalanceRaw,
    onTypeAmount,
    onSelectPercent,
    resetAmount,

    // native
    withdrawableAssets,
    nativeAsset,
    nativeAssetAddress,
    setNativeAssetAddress,
    queueLimits,
    nativeAmountOut,
    isLoadingPreview,

    // any token
    swapToken,
    setSwapToken,
    priceImpact: zapPriceImpact,
    priceImpactResult: zapPriceImpactResult,
    isSlippageResolving: slippageAdvice.isResolving,
    slippageNotice: getVaultSlippageNotice(slippageAdvice, slippage, zapWithdraw.route?.zapDetails.suggestedSlippage),
    suggestedSlippage: getVaultSuggestedSlippage(slippageAdvice, zapWithdraw.route?.zapDetails.suggestedSlippage),
    sharesUsd,
    minReceivedUsd,
    zapRoute: zapWithdraw.route,
    zapAmountOutRaw: zapWithdraw.amountOutRaw,
    zapMinAmountOutRaw: zapWithdraw.minAmountOutRaw,
    zapRouteError: zapWithdraw.routeError,
    isRouteLoading: zapWithdraw.isRouteLoading,
    isRouteStale: zapWithdraw.isRouteStale,

    submitError: active.submitError,

    /** Fed to `useProcessingSteps` so the confirmation can run approve → withdraw in the open. */
    processing: {
      chainId: chainId as number,
      // Shares are an ERC20 the queue or the router pulls, so an allowance is always in play. The
      // approve step re-reads it on chain and skips itself when one is already in place.
      steps: [VAULT_APPROVE_STEP, VAULT_ACTION_STEP] as VaultStep[],
      approveStep: VAULT_APPROVE_STEP,
      actionStep: VAULT_ACTION_STEP,
      approval: active.approvalState,
      approveCallback: active.approve,
      checkApprovalManually,
      onFinalStep: isNative ? nativeWithdraw.requestWithdraw : zapWithdraw.submit,
    },

    insufficientShares,
    belowMinimum,
    assetUnavailable,
    noWithdrawableAsset,
    missingQueue,
    wrongChain,
    isReady,
    actionBlocker,
    blockingError,
  }
}

export type WithdrawFormState = ReturnType<typeof useWithdrawForm>
