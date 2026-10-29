import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { useMemo, useRef } from 'react'
import { VaultApiDetailItem } from 'services/vault'

import type { ProcessingStepFailure } from 'components/ProcessingSteps/useProcessingSteps'
import { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { DepositFormState } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import { WithdrawFormState, WithdrawMode } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { VAULT_ACTION_STEP, VaultStep, vaultApproveStep } from 'pages/Earns/components/vaultSteps'
import {
  VAULT_DEPOSIT_APPROVAL_TRACKING,
  VAULT_WITHDRAW_APPROVAL_TRACKING,
  getVaultApy,
  getVaultTrackingChain,
  getVaultTvlUsd,
  toTrackingTokenAddress,
  useVaultTracking,
  vaultTargetFromDetail,
} from 'pages/Earns/hooks/useVaultTracking'
import { friendlyError } from 'utils/errorMessage'
import { formatUnits } from 'utils/viem'

type TrackingPayload = Record<string, unknown>

const ERROR_TYPE: Record<ProcessingStepFailure['reason'], string> = {
  rejected: 'user_rejected',
  reverted: 'tx_reverted',
  unconfirmed: 'tx_unconfirmed',
  failed: 'tx_failed',
}

const ERROR_MESSAGE: Record<ProcessingStepFailure['reason'], string> = {
  rejected: 'User rejected the transaction',
  reverted: 'Transaction reverted',
  unconfirmed: 'Transaction was not confirmed in time',
  failed: 'Transaction failed',
}

const toErrorFields = ({ reason, error }: ProcessingStepFailure) => ({
  error_type: ERROR_TYPE[reason],
  error_message: error instanceof Error || typeof error === 'string' ? friendlyError(error) : ERROR_MESSAGE[reason],
})

const finiteOrUndefined = (value: number | null | undefined) =>
  value !== null && value !== undefined && Number.isFinite(value) ? value : undefined

export const toWithdrawMethod = (mode: WithdrawMode) => (mode === WithdrawMode.NATIVE ? 'native' : 'any_token')

/**
 * The parts of a vault funnel that run through the review and the step sequence, shared by the form
 * on the vault page and the one in the card modal.
 *
 * The figures are frozen when the user confirms: the confirmed payload goes onto the transaction for
 * `Completed`, and every failure of that run reports the same figures.
 */
const useVaultFlowEvents = ({
  vault,
  events,
  failedSteps,
  buildPayload,
}: {
  vault: VaultApiDetailItem
  events: { reviewOpened: TRACKING_EVENT_TYPE; confirmed: TRACKING_EVENT_TYPE; failed: TRACKING_EVENT_TYPE }
  failedSteps: { approve: string; action: string }
  buildPayload: () => TrackingPayload
}) => {
  const target = useMemo(() => vaultTargetFromDetail(vault), [vault])
  const { track, props, trackingHandler } = useVaultTracking(target)
  const confirmedRef = useRef<TrackingPayload>({})

  const trackReviewOpened = () => track(events.reviewOpened, buildPayload())

  const trackConfirmed = () => {
    confirmedRef.current = { ...props, ...buildPayload() }
    trackingHandler(events.confirmed, confirmedRef.current)
  }

  const onStepFailed = (step: VaultStep, failure: ProcessingStepFailure) => {
    const isAction = step === VAULT_ACTION_STEP
    // An action that reached the chain is settled by its receipt in the transaction updater.
    if (isAction && (failure.reason === 'reverted' || failure.reason === 'unconfirmed')) return
    trackingHandler(events.failed, {
      ...confirmedRef.current,
      failed_step: isAction ? failedSteps.action : failedSteps.approve,
      ...toErrorFields(failure),
    })
  }

  /** `Token Approval Initiated`, in the swap form's shape, for an approval the wallet is about to prompt for. */
  const trackApprovalInitiated = (
    token: { symbol?: string; address: string },
    spender: string | undefined,
    approvalTracking: TrackingPayload,
  ) =>
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_APPROVAL_INITIATED, {
      token_symbol: token.symbol,
      token_address: token.address,
      spender_address: spender,
      approval_type: 'approve',
      // The step sequence approves without an amount, which grants an unlimited allowance.
      approval_amount: 'unlimited',
      chain: getVaultTrackingChain(target),
      ...approvalTracking,
    })

  return { track, confirmedRef, trackReviewOpened, trackConfirmed, onStepFailed, trackApprovalInitiated }
}

export const useVaultDepositTracking = ({ vault, form }: { vault: VaultApiDetailItem; form: DepositFormState }) => {
  const buildPayload = (): TrackingPayload => {
    const spent = form.rows.filter(row => row.parsedAmount?.greaterThan(0))
    const shareDecimals = vault.shareToken?.decimals ?? 18
    return {
      from_token: spent[0]?.currency.symbol,
      from_tokens: spent.map(row => row.currency.symbol ?? ''),
      from_token_addresses: spent.map(row =>
        toTrackingTokenAddress(row.currency.isNative ? NATIVE_TOKEN_ADDRESS : row.currency.wrapped.address),
      ),
      amounts_in: spent.map(row => row.parsedAmount?.toExact() ?? '0'),
      token_count: spent.length,
      amount_in_usd: finiteOrUndefined(form.totalUsd),
      to_token: vault.shareToken?.symbol,
      shares_out: form.sharesOutRaw !== undefined ? formatUnits(form.sharesOutRaw, shareDecimals) : undefined,
      min_shares_out: form.minSharesOutRaw !== undefined ? formatUnits(form.minSharesOutRaw, shareDecimals) : undefined,
      price_impact: finiteOrUndefined(form.priceImpact),
      max_slippage: form.slippage / 100,
      is_degen_mode: form.isDegenMode,
      vault_apy: getVaultApy(vault),
    }
  }

  const flow = useVaultFlowEvents({
    vault,
    events: {
      reviewOpened: TRACKING_EVENT_TYPE.VAULT_DEPOSIT_REVIEW_OPENED,
      confirmed: TRACKING_EVENT_TYPE.VAULT_DEPOSIT_CONFIRMED,
      failed: TRACKING_EVENT_TYPE.VAULT_DEPOSIT_FAILED,
    },
    failedSteps: { approve: 'approve', action: 'deposit' },
    buildPayload,
  })

  /** On the vault page the form is already open, so its own Deposit button is the click into the funnel. */
  const trackClicked = () =>
    flow.track(TRACKING_EVENT_TYPE.VAULT_DEPOSIT_CLICKED, {
      vault_apy: getVaultApy(vault),
      vault_tvl_usd: getVaultTvlUsd(vault),
    })

  const processing = {
    ...form.processing,
    approvals: form.processing.approvals.map(entry => ({
      ...entry,
      approveCallback: () => {
        const row = form.rows.find(
          row => !row.currency.isNative && vaultApproveStep(row.currency.wrapped.address) === entry.step,
        )
        if (row) {
          flow.trackApprovalInitiated(
            { symbol: row.currency.symbol, address: row.currency.wrapped.address },
            form.route?.allowanceHubAddress,
            VAULT_DEPOSIT_APPROVAL_TRACKING,
          )
        }
        return entry.approveCallback()
      },
    })),
    onFinalStep: () => form.processing.onFinalStep(flow.confirmedRef.current),
    onStepFailed: flow.onStepFailed,
  }

  return {
    trackClicked,
    trackReviewOpened: flow.trackReviewOpened,
    trackConfirmed: flow.trackConfirmed,
    processing,
  }
}

export const useVaultWithdrawTracking = ({ vault, form }: { vault: VaultApiDetailItem; form: WithdrawFormState }) => {
  const buildPayload = (): TrackingPayload => {
    const outToken = form.isNative
      ? form.nativeAsset && {
          symbol: form.nativeAsset.symbol,
          address: form.nativeAsset.assetAddress,
          decimals: form.nativeAsset.decimals,
        }
      : form.swapToken
    const amountOutRaw = form.isNative ? form.nativeAmountOut : form.zapAmountOutRaw

    const payload: TrackingPayload = {
      withdraw_method: toWithdrawMethod(form.mode),
      shares_in: form.shares ? formatUnits(form.shares, form.shareDecimals) : undefined,
      percent_of_balance:
        form.shares && form.shareBalanceRaw > 0n
          ? Number((form.shares * 10000n) / form.shareBalanceRaw) / 100
          : undefined,
      to_token: outToken?.symbol,
      to_token_address: outToken ? toTrackingTokenAddress(outToken.address) : undefined,
      amount_out: outToken && amountOutRaw !== undefined ? formatUnits(amountOutRaw, outToken.decimals) : undefined,
      // The queue quotes no route, so its payout is priced off the feed; a sale is priced by its route.
      amount_out_usd: finiteOrUndefined(
        form.isNative
          ? form.minReceivedUsd
          : form.zapRoute
          ? Number(form.zapRoute.zapDetails.finalAmountUsd)
          : undefined,
      ),
    }

    if (form.isNative) {
      return {
        ...payload,
        // The queue's discount is in basis points; sent as a percentage, like the slippage.
        queue_discount: form.queueLimits ? form.queueLimits.minDiscount / 100 : undefined,
        seconds_to_maturity: form.queueLimits?.secondsToMaturity,
      }
    }

    return {
      ...payload,
      price_impact: finiteOrUndefined(form.priceImpact),
      max_slippage: form.slippage / 100,
      is_degen_mode: form.isDegenMode,
    }
  }

  const flow = useVaultFlowEvents({
    vault,
    events: {
      reviewOpened: TRACKING_EVENT_TYPE.VAULT_WITHDRAW_REVIEW_OPENED,
      confirmed: TRACKING_EVENT_TYPE.VAULT_WITHDRAW_CONFIRMED,
      failed: TRACKING_EVENT_TYPE.VAULT_WITHDRAW_FAILED,
    },
    failedSteps: { approve: 'approve', action: 'withdraw' },
    buildPayload,
  })

  const { approveCallback } = form.processing

  const processing = {
    ...form.processing,
    approveCallback: () => {
      if (form.shareToken) {
        flow.trackApprovalInitiated(
          { symbol: form.shareToken.symbol, address: form.shareToken.address },
          // The queue pulls the shares for a native redemption; the router pulls them for a sale.
          form.isNative ? form.queueAddress : form.zapRoute?.allowanceHubAddress,
          VAULT_WITHDRAW_APPROVAL_TRACKING,
        )
      }
      return approveCallback()
    },
    onFinalStep: () => form.processing.onFinalStep(flow.confirmedRef.current),
    onStepFailed: flow.onStepFailed,
  }

  return {
    trackReviewOpened: flow.trackReviewOpened,
    trackConfirmed: flow.trackConfirmed,
    processing,
  }
}
