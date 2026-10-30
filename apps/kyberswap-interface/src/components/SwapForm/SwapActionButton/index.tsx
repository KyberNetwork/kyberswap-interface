import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import Select from 'components/Select'
import { HStack, Stack } from 'components/Stack'
import SwapOnlyButton from 'components/SwapForm/SwapActionButton/SwapOnlyButton'
import type { BuildReview, SubmitReview, SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { PermitState, usePermit } from 'hooks/usePermit'
import { restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useWalletModalToggle } from 'state/application/hooks'
import { DetailedRouteSummary } from 'types/route'
import { paysNativeOnSwap } from 'utils/nativeErc20'

enum AllowanceType {
  EXACT = 'EXACT',
  INFINITE = 'INFINITE',
}

const ApprovalTooltip = ({
  currency,
  allowance,
  walletKey,
}: {
  currency: Currency | undefined
  allowance: CurrencyAmount<Currency> | undefined
  walletKey: string
}) => {
  const walletHelpUrl =
    walletKey === 'METAMASK'
      ? 'https://support.metamask.io/hc/en-us/articles/6055177143579-How-to-customize-token-approvals-with-a-spending-cap'
      : walletKey === 'TRUST_WALLET'
      ? 'https://community.trustwallet.com/t/what-is-token-approval/242764'
      : undefined

  if (allowance?.greaterThan(0) && walletHelpUrl) {
    return (
      <Trans>
        Approve <b>{currency?.symbol}</b> requires to be more than <b>{`${allowance.toExact()} ${currency?.symbol}`}</b>
        , find out more{' '}
        <a href={walletHelpUrl} target="_blank" rel="noreferrer">
          here
        </a>
      </Trans>
    )
  }

  return (
    <Trans>
      You need to first allow KyberSwap&apos;s smart contract to use your {currency?.symbol}.{' '}
      <a
        href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-superior-rates#step-4-approve-contract-to-swap-tokens"
        target="_blank"
        rel="noreferrer"
      >
        Read more ↗
      </a>
    </Trans>
  )
}

type Props = {
  isGettingRoute: boolean

  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  routeSummary: DetailedRouteSummary | undefined

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  swapInputError: string | undefined
  wrapInputError: string | undefined
  wrapType: WrapType

  review: SwapReviewState
  onOpenReview: (build: BuildReview) => Promise<void>
  onConfirmReview: (submit: SubmitReview, onError: (message: string) => void) => Promise<void>
  onDismissReview: () => void
  onWrap: (() => Promise<string | undefined>) | undefined
  buildRoute: BuildReview
  customChainId?: ChainId
  chainError?: string
}

const SwapActionButton = ({
  isGettingRoute,

  parsedAmountFromTypedValue,
  routeSummary,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,

  swapInputError,
  wrapInputError,
  wrapType,

  review,
  onOpenReview,
  onConfirmReview,
  onDismissReview,
  onWrap,
  buildRoute,
  customChainId,
  chainError,
}: Props) => {
  const isProcessingSwap = review.phase !== 'closed'
  const theme = useTheme()
  const { changeNetwork } = useChangeNetwork()
  const { account, walletKey, chainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const noRouteFound = routeSummary && !routeSummary.route

  const toggleWalletModal = useWalletModalToggle()

  const isTokenRestricted = useIsTokenRestricted()
  const restrictedCurrency = isTokenRestricted(currencyIn)
    ? currencyIn
    : isTokenRestricted(currencyOut)
    ? currencyOut
    : undefined

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmountFromTypedValue && !parsedAmountFromTypedValue.equalTo(0),
  )

  const handleApprovalError = useCallback(
    (errorInfo: { message: string; tokenSymbol?: string; tokenAddress?: string; spender?: string }) => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_FAILED, {
        token_symbol: errorInfo.tokenSymbol,
        token_address: errorInfo.tokenAddress,
        spender_address: errorInfo.spender,
        error_message: errorInfo.message,
        chain: networkInfo?.name,
      })
    },
    [trackingHandler, networkInfo?.name],
  )

  // Where the native asset has a built-in ERC-20 interface, a swap is paid through the native one, so
  // the router never calls `transferFrom` and there is nothing to approve or permit. Other surfaces
  // (limit orders, zap) still move the token by allowance and keep the normal flow.
  const paysNative = paysNativeOnSwap(currencyIn)

  const [rawApproval, approveCallback, currentAllowance] = useApproveCallback({
    amount: paysNative ? undefined : parsedAmountFromTypedValue,
    spender: routeSummary?.routerAddress,
    onApprovalError: handleApprovalError,
  })
  const approval = paysNative ? ApprovalState.APPROVED : rawApproval

  const { permitState, permitCallback } = usePermit(
    paysNative ? undefined : parsedAmountFromTypedValue,
    routeSummary?.routerAddress,
  )

  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) &&
    permitState !== PermitState.SIGNED

  const [loading, setLoading] = useState(false)
  const [approvalType, setApprovalType] = useState(AllowanceType.INFINITE)
  const pendingApproval = useRef<object | null>(null)
  const approvalIdentity = JSON.stringify([
    account,
    walletKey,
    chainId,
    currencyIn?.wrapped.address,
    routeSummary?.routerAddress,
    parsedAmountFromTypedValue?.toExact(),
  ])

  useLayoutEffect(() => {
    pendingApproval.current = null
    setLoading(false)

    return () => {
      pendingApproval.current = null
    }
  }, [approvalIdentity, showApproveFlow])

  const requestApproval = async (request: () => Promise<unknown>) => {
    if (pendingApproval.current || approval === ApprovalState.PENDING) return

    const pending = {}
    pendingApproval.current = pending
    setLoading(true)

    try {
      await request()
    } finally {
      if (pendingApproval.current === pending) {
        pendingApproval.current = null
        setLoading(false)
      }
    }
  }

  const handlePermitClick = () => {
    void requestApproval(() => {
      trackingHandler(TRACKING_EVENT_TYPE.PERMIT_CLICK)
      return permitCallback()
    })
  }

  const handleApproveClick = () => {
    void requestApproval(() => {
      trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_INITIATED, {
        token_symbol: currencyIn?.symbol,
        token_address: currencyIn?.isNative ? 'NATIVE' : currencyIn?.wrapped?.address,
        spender_address: routeSummary?.routerAddress,
        approval_type: 'approve',
        approval_amount: approvalType === AllowanceType.EXACT ? parsedAmountFromTypedValue?.toExact() : 'unlimited',
        chain: networkInfo?.name,
      })

      return approveCallback(
        approvalType === AllowanceType.EXACT && parsedAmountFromTypedValue ? parsedAmountFromTypedValue : undefined,
      )
    })
  }

  const ApproveButton = permitState === PermitState.NOT_SIGNED ? ButtonLight : ButtonPrimary

  const showSwapButton = !(
    chainError ||
    !account ||
    (customChainId && customChainId !== chainId) ||
    restrictedCurrency ||
    wrapInputError ||
    showWrap ||
    (userHasSpecifiedInputOutput && noRouteFound) ||
    swapInputError ||
    showApproveFlow
  )

  return (
    <>
      {chainError ? (
        <ButtonPrimary id="swap-button" className="whitespace-nowrap text-sm" disabled>
          {chainError}
        </ButtonPrimary>
      ) : !account ? (
        <ButtonLight onClick={toggleWalletModal}>
          <Trans>Connect</Trans>
        </ButtonLight>
      ) : customChainId && customChainId !== chainId ? (
        <ButtonLight onClick={() => changeNetwork(customChainId)}>
          <Trans>Switch to {NETWORKS_INFO[customChainId].name}</Trans>
        </ButtonLight>
      ) : restrictedCurrency ? (
        <ButtonPrimary id="swap-button" disabled>
          {restrictedTokenMessage(restrictedCurrency.symbol)}
        </ButtonPrimary>
      ) : wrapInputError ? (
        <ButtonPrimary id="swap-button" disabled>
          {wrapInputError}
        </ButtonPrimary>
      ) : showWrap ? (
        <ButtonPrimary id="swap-button" onClick={onWrap}>
          {wrapType === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>}
        </ButtonPrimary>
      ) : userHasSpecifiedInputOutput && noRouteFound ? (
        <ButtonPrimary id="swap-button" disabled>
          <Trans>Insufficient liquidity for this trade</Trans>
        </ButtonPrimary>
      ) : swapInputError ? (
        <ButtonPrimary id="swap-button" disabled>
          {swapInputError}
        </ButtonPrimary>
      ) : showApproveFlow ? (
        <Stack className="gap-4">
          <HStack className="w-full items-center justify-between gap-4">
            {permitState === PermitState.NOT_SIGNED && (
              <ButtonConfirmed
                disabled={loading || approval === ApprovalState.PENDING}
                onClick={handlePermitClick}
                className="flex-1"
              >
                <HStack className="w-fit items-center gap-1">
                  <InfoHelper
                    margin={false}
                    className="text-textReverse"
                    placement="top"
                    text={
                      <Trans>
                        You need to first give a temporary 24H approval to KyberSwap&apos;s smart contract to use your{' '}
                        {currencyIn?.symbol}. This doesn&apos;t require a gas fees.{' '}
                        <a
                          href="https://docs.kyberswap.com/reference/permitable-tokens"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Read more ↗
                        </a>
                      </Trans>
                    }
                  />
                  <Trans>Permit {currencyIn?.symbol}</Trans>
                </HStack>
              </ButtonConfirmed>
            )}

            <ApproveButton
              onClick={handleApproveClick}
              disabled={loading || approval === ApprovalState.PENDING}
              className="flex-1 border-none"
            >
              {approval === ApprovalState.PENDING ? (
                <HStack className="flex-wrap items-center justify-center gap-1.5">
                  <Trans>Approving</Trans> <Loader className="text-border" />
                </HStack>
              ) : (
                <HStack className="w-fit items-center gap-1">
                  <InfoHelper
                    margin={false}
                    color={!loading && permitState === PermitState.NOT_SIGNED ? theme.primary : theme.textReverse}
                    placement="top"
                    text={<ApprovalTooltip currency={currencyIn} allowance={currentAllowance} walletKey={walletKey} />}
                  />
                  <Trans>Approve {currencyIn?.symbol}</Trans>
                </HStack>
              )}
            </ApproveButton>
          </HStack>
          <HStack className="w-full items-center justify-end">
            <Select
              value={approvalType}
              className="bg-transparent p-0 text-sm"
              optionStyle={{ fontSize: '14px' }}
              options={[
                {
                  value: AllowanceType.INFINITE,
                  label: t`Infinite Allowance`,
                  onSelect: () => setApprovalType(AllowanceType.INFINITE),
                },
                {
                  value: AllowanceType.EXACT,
                  label: t`Exact Allowance`,
                  onSelect: () => setApprovalType(AllowanceType.EXACT),
                },
              ]}
              activeRender={selected =>
                selected ? (
                  <div className="flex items-center gap-1">
                    {selected.label}{' '}
                    <InfoHelper
                      margin={false}
                      text={
                        selected.value === AllowanceType.EXACT
                          ? t`You wish to give KyberSwap permission to use the exact allowance token amount as the amount in for this transaction, Subsequent transactions will require your permission again.`
                          : t`You wish to give KyberSwap permission to use the selected token for transactions without any limit. You do not need to give permission again unless revoke.`
                      }
                    />
                  </div>
                ) : null
              }
            />
          </HStack>
        </Stack>
      ) : null}
      {(showSwapButton || isProcessingSwap) && (
        <SwapOnlyButton
          showButton={showSwapButton}
          routeSummary={routeSummary}
          isGettingRoute={isGettingRoute}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          balanceIn={balanceIn}
          balanceOut={balanceOut}
          parsedAmount={parsedAmountFromTypedValue}
          isPermitSwap={permitState === PermitState.SIGNED}
          isApproved={approval === ApprovalState.APPROVED || permitState === PermitState.SIGNED}
          review={review}
          onOpenReview={onOpenReview}
          onConfirmReview={onConfirmReview}
          onDismissReview={onDismissReview}
          buildRoute={buildRoute}
        />
      )}
    </>
  )
}

export default SwapActionButton
