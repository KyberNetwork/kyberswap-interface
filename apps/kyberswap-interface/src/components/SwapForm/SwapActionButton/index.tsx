import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import Select from 'components/Select'
import SwapOnlyButton from 'components/SwapForm/SwapActionButton/SwapOnlyButton'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { SwapCallbackError } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { PermitState, usePermit } from 'hooks/usePermit'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useWalletModalToggle } from 'state/application/hooks'
import { DetailedRouteSummary } from 'types/route'

import { Props as SwapOnlyButtonProps } from './SwapOnlyButton'

enum AllowanceType {
  EXACT = 'EXACT',
  INFINITE = 'INFINITE',
}

const CUSTOM_PRIMARY_BUTTON_CLASS = 'border-none font-medium disabled:border-none'

type Props = {
  isDegenMode: boolean
  isGettingRoute: boolean
  isProcessingSwap: boolean

  typedValue: string
  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  routeSummary: DetailedRouteSummary | undefined

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  swapInputError: string | undefined
  wrapInputError: string | undefined
  wrapType: WrapType

  setProcessingSwap: React.Dispatch<React.SetStateAction<boolean>>
  onWrap: (() => Promise<string | undefined>) | undefined
  buildRoute: () => Promise<BuildRouteResult>
  customChainId?: ChainId
}

const SwapActionButton: React.FC<Props> = ({
  isDegenMode,
  isGettingRoute,
  isProcessingSwap,

  typedValue,
  parsedAmountFromTypedValue,
  routeSummary,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,

  swapInputError,
  wrapInputError,
  wrapType,

  setProcessingSwap,
  onWrap,
  buildRoute,
  customChainId,
}) => {
  const theme = useTheme()
  const { changeNetwork } = useChangeNetwork()
  const { account, walletKey, chainId, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const [errorWhileSwap, setErrorWhileSwap] = useState('')
  const noRouteFound = routeSummary && !routeSummary.route

  const toggleWalletModal = useWalletModalToggle()

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

  const [approval, approveCallback, currentAllowance] = useApproveCallback(
    parsedAmountFromTypedValue,
    routeSummary?.routerAddress,
    false,
    handleApprovalError,
  )

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const { permitState, permitCallback } = usePermit(parsedAmountFromTypedValue, routeSummary?.routerAddress)

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    if (!isProcessingSwap) {
      setApprovalSubmitted(false)
    }
  }, [currencyIn, typedValue, isProcessingSwap])

  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) &&
    permitState !== PermitState.SIGNED

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!showApproveFlow) setLoading(false)
  }, [showApproveFlow])

  const [approvalType, setApprovalType] = useState(AllowanceType.INFINITE)
  const handleApproveClick = () => {
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_INITIATED, {
      token_symbol: currencyIn?.symbol,
      token_address: currencyIn?.isNative ? 'NATIVE' : currencyIn?.wrapped?.address,
      spender_address: routeSummary?.routerAddress,
      approval_type: approvalType === AllowanceType.EXACT ? 'approve' : 'approve',
      approval_amount: approvalType === AllowanceType.EXACT ? parsedAmountFromTypedValue?.toExact() : 'unlimited',
      chain: networkInfo?.name,
    })
    setLoading(true)
    approveCallback(
      approvalType === AllowanceType.EXACT && parsedAmountFromTypedValue ? parsedAmountFromTypedValue : undefined,
    ).finally(() => setLoading(false))
  }

  const approveTooltipText = () => {
    if (currentAllowance && +currentAllowance?.toExact() > 0) {
      if (walletKey && walletKey?.toString() === 'METAMASK') {
        return (
          <Trans>
            Approve <b>{currencyIn?.symbol}</b> requires to be more than{' '}
            <b>{`${currentAllowance.toExact()} ${currencyIn?.symbol}`}</b>, find out more{' '}
            <a
              href="https://support.metamask.io/hc/en-us/articles/6055177143579-How-to-customize-token-approvals-with-a-spending-cap"
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
          </Trans>
        )
      }
      if (walletKey && walletKey?.toString() === 'TRUST_WALLET') {
        return (
          <Trans>
            Approve <b>{currencyIn?.symbol}</b> requires to be more than{' '}
            <b>{`${currentAllowance.toExact()} ${currencyIn?.symbol}`}</b>, find out more{' '}
            <a
              href="https://community.trustwallet.com/t/what-is-token-approval/242764"
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
          </Trans>
        )
      }
    }

    return (
      <Trans>
        You need to first allow KyberSwap&apos;s smart contract to use your {currencyIn?.symbol}.{' '}
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
  const renderButton = () => {
    if (!account) {
      return (
        <ButtonLight onClick={toggleWalletModal}>
          <Trans>Connect</Trans>
        </ButtonLight>
      )
    }

    if (customChainId && customChainId !== chainId) {
      return (
        <ButtonLight onClick={() => changeNetwork(customChainId)}>
          <Trans>Switch to {NETWORKS_INFO[customChainId].name}</Trans>
        </ButtonLight>
      )
    }

    if (wrapInputError) {
      return (
        <ButtonPrimary id="swap-button" className={CUSTOM_PRIMARY_BUTTON_CLASS} disabled>
          {wrapInputError}
        </ButtonPrimary>
      )
    }

    if (showWrap) {
      return (
        <ButtonPrimary id="swap-button" className={CUSTOM_PRIMARY_BUTTON_CLASS} onClick={onWrap}>
          {wrapType === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>}
        </ButtonPrimary>
      )
    }

    if (userHasSpecifiedInputOutput && noRouteFound) {
      return (
        <ButtonPrimary id="swap-button" className={CUSTOM_PRIMARY_BUTTON_CLASS} disabled>
          <Trans>Insufficient liquidity for this trade</Trans>
        </ButtonPrimary>
      )
    }

    if (swapInputError) {
      return (
        <ButtonPrimary id="swap-button" className={CUSTOM_PRIMARY_BUTTON_CLASS} disabled>
          {swapInputError}
        </ButtonPrimary>
      )
    }

    const swapOnlyButtonProps: SwapOnlyButtonProps = {
      isDegenMode: isDegenMode,
      routeSummary,
      isGettingRoute,
      isProcessingSwap,

      currencyIn,
      currencyOut,
      balanceIn,
      balanceOut,
      parsedAmount: parsedAmountFromTypedValue,
      isPermitSwap: permitState === PermitState.SIGNED,

      setProcessingSwap,
      setErrorWhileSwap,
      buildRoute,

      isApproved: approval === ApprovalState.APPROVED || permitState === PermitState.SIGNED,
    }

    const Approvebtn = permitState === PermitState.NOT_SIGNED ? ButtonLight : ButtonPrimary

    if (showApproveFlow) {
      return (
        <div>
          <RowBetween style={{ gap: '1rem' }}>
            {permitState === PermitState.NOT_SIGNED && (
              <ButtonConfirmed
                disabled={loading || approval === ApprovalState.PENDING}
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.PERMIT_CLICK)
                  setLoading(true)
                  permitCallback().finally(() => setLoading(false))
                }}
                style={{
                  flex: 1,
                }}
              >
                <RowFit gap="4px">
                  <InfoHelper
                    color={theme.textReverse}
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
                </RowFit>
              </ButtonConfirmed>
            )}

            <Approvebtn
              onClick={handleApproveClick}
              disabled={loading || approval === ApprovalState.PENDING}
              style={{
                border: 'none',
                flex: 1,
              }}
            >
              {approval === ApprovalState.PENDING ? (
                <AutoRow gap="6px" justify="center">
                  <Trans>Approving</Trans> <Loader stroke={theme.border} />
                </AutoRow>
              ) : (
                <RowFit gap="4px">
                  <InfoHelper
                    color={!loading && permitState === PermitState.NOT_SIGNED ? theme.primary : theme.textReverse}
                    placement="top"
                    text={approveTooltipText()}
                  />
                  <Trans>Approve {currencyIn?.symbol}</Trans>
                </RowFit>
              )}
            </Approvebtn>
          </RowBetween>
          <RowBetween>
            <div />
            <Select
              value={approvalType}
              style={{ marginTop: '1rem', fontSize: '14px', padding: 0, background: 'transparent' }}
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
                  <div className="flex">
                    {selected.label}{' '}
                    <InfoHelper
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
          </RowBetween>
        </div>
      )
    }

    return <SwapOnlyButton {...swapOnlyButtonProps} />
  }

  useEffect(() => {
    setErrorWhileSwap('')
  }, [typedValue])

  return (
    <>
      {renderButton()}
      {isDegenMode && errorWhileSwap ? (
        <SwapCallbackError style={{ margin: 0, zIndex: 'unset' }} error={errorWhileSwap} />
      ) : null}
    </>
  )
}

export default SwapActionButton
