import { Token as TokenSchema } from '@kyber/schema'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { VaultApiDetailItem, VaultPositionItem, useVaultSupportedAssetsQuery } from 'services/vault'

import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useVaultWithdraw } from 'pages/Earns/VaultDetail/hooks/useVaultWithdraw'
import { useWithdrawAssetConfig, useWithdrawPreview } from 'pages/Earns/VaultDetail/hooks/useWithdrawQueue'
import { useZapSwap } from 'pages/Earns/hooks/useZapSwap'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatUnits, parseUnits } from 'utils/viem'

export enum WithdrawMode {
  /** Sell the shares through the aggregator; settles in one transaction. */
  ANY_TOKEN = 'any',
  /** Queue a redemption with the vault; the solver delivers the asset later. */
  NATIVE = 'native',
}

export const DEFAULT_SLIPPAGE_BPS = 50
export const PERCENT_OPTIONS = [25, 50, 75, 100] as const

export const useWithdrawForm = ({
  vault,
  position,
  onSubmitted,
  pausePolling,
}: {
  vault: VaultApiDetailItem
  position?: VaultPositionItem
  onSubmitted?: () => void
  /** Hold the quote steady while the user is reviewing or signing it. */
  pausePolling?: boolean
}) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()

  const chainId = vault.chain?.id
  const queueAddress = vault.contracts?.withdrawQueue
  const shareDecimals = vault.shareToken?.decimals ?? 18
  const shareSymbol = vault.shareToken?.symbol ?? ''

  // Native redemption needs the vault's queue; without it the tab would open on a blocked mode.
  const [mode, setMode] = useState<WithdrawMode>(queueAddress ? WithdrawMode.NATIVE : WithdrawMode.ANY_TOKEN)
  const [typedValue, setTypedValue] = useState('')
  const [percent, setPercent] = useState<number | undefined>(undefined)
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE_BPS)

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

  const isNative = mode === WithdrawMode.NATIVE

  const { config: queueConfig, isLoading: isLoadingConfig } = useWithdrawAssetConfig({
    chainId,
    queueAddress,
    assetOut: nativeAssetAddress,
    enabled: isNative,
  })

  const { amountOut: nativeAmountOut, isLoading: isLoadingPreview } = useWithdrawPreview({
    chainId,
    queueAddress,
    assetOut: nativeAssetAddress,
    shares,
    discount: queueConfig?.minDiscount,
    enabled: isNative,
  })

  const nativeWithdraw = useVaultWithdraw({
    chainId,
    queueAddress,
    shareToken,
    shares,
    assetOut: nativeAssetAddress,
    discount: queueConfig?.minDiscount,
    secondsToDeadline: queueConfig?.minimumSecondsToDeadline,
    onSubmitted: () => {
      setTypedValue('')
      setPercent(undefined)
      onSubmitted?.()
    },
  })

  // ---- any-token path: the aggregator sells the shares outright ----
  const [swapToken, setSwapToken] = useState<TokenSchema | undefined>(undefined)

  // Default to the vault's own asset; the API's token shape has no `name`, which the selector's does.
  useEffect(() => {
    const underlying = vault.underlyingToken
    if (!underlying?.address) return
    setSwapToken(
      current =>
        current ?? {
          address: underlying.address,
          symbol: underlying.symbol,
          name: underlying.symbol,
          decimals: underlying.decimals,
          logo: underlying.logo,
        },
    )
  }, [vault.underlyingToken])

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
    tokenInAddress: mode === WithdrawMode.ANY_TOKEN ? vault.shareToken?.address : undefined,
    tokenOutAddress: swapToken?.address,
    amountInRaw: shares?.toString(),
    approvalAmount,
    slippage,
    transactionType: TRANSACTION_TYPE.EARN_VAULT_WITHDRAW,
    errorTitle: t`Withdrawal failed`,
    buildExtraInfo: zapExtraInfo,
    pausePolling,
    onSubmitted: () => {
      setTypedValue('')
      setPercent(undefined)
      onSubmitted?.()
    },
  })

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

  const active = isNative ? nativeWithdraw : zapWithdraw

  const insufficientShares = Boolean(shares && shares > shareBalanceRaw)
  const belowMinimum = Boolean(isNative && shares && queueConfig?.minimumShares && shares < queueConfig.minimumShares)
  const assetUnavailable = Boolean(isNative && nativeAssetAddress && queueConfig && !queueConfig.allowWithdraws)
  const noWithdrawableAsset = isNative && !isLoadingAssets && withdrawableAssets.length === 0
  const missingQueue = isNative && !queueAddress
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
      // An unresolved or pending allowance is not a spendable one: the queue or router would revert.
      active.approvalState === ApprovalState.APPROVED &&
      (isNative
        ? // The queue's terms are arguments to the request; without them there is nothing to submit.
          Boolean(queueConfig) && !isLoadingConfig
        : Boolean(zapWithdraw.route) && !zapWithdraw.isRouteStale),
  )

  return {
    account,
    chainId,
    mode,
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

    // native
    withdrawableAssets,
    nativeAsset,
    nativeAssetAddress,
    setNativeAssetAddress,
    queueConfig,
    nativeAmountOut,
    isLoadingPreview,

    // any token
    swapToken,
    setSwapToken,
    zapRoute: zapWithdraw.route,
    zapAmountOutRaw: zapWithdraw.amountOutRaw,
    zapMinAmountOutRaw: zapWithdraw.minAmountOutRaw,
    zapRouteError: zapWithdraw.routeError,
    isRouteLoading: zapWithdraw.isRouteLoading,
    isRouteStale: zapWithdraw.isRouteStale,

    // shared action surface
    needsApproval: active.needsApproval,
    isApproving: active.isApproving,
    approve: active.approve,
    submit: isNative ? nativeWithdraw.requestWithdraw : zapWithdraw.submit,
    isSubmitting: active.isSubmitting,
    submitError: active.submitError,

    insufficientShares,
    belowMinimum,
    assetUnavailable,
    noWithdrawableAsset,
    missingQueue,
    wrongChain,
    isReady,
  }
}

export type WithdrawFormState = ReturnType<typeof useWithdrawForm>
