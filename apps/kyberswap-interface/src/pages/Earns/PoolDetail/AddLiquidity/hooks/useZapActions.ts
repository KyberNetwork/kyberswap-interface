import { APPROVAL_STATE, useDebounce } from '@kyber/hooks'
import { useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import { ApprovalState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useApproval'
import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getPrimaryValidationError } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

interface UseZapActionsProps {
  state: ZapState
  approval: ApprovalState
  poolChainId: number
  isZapImpactBlocked: boolean
  onOpenSettings?: () => void
  preview?: {
    loading?: boolean
    onPreview?: () => Promise<void>
  }
}

export default function useZapActions({
  state,
  approval,
  poolChainId,
  isZapImpactBlocked,
  onOpenSettings,
  preview,
}: UseZapActionsProps) {
  const { account, walletChainId, toggleWalletModal, changeNetwork } = useAddLiquidityRuntimeContext()

  const route = state.route.data
  const routeLoading = state.route.loading
  const hasPositiveInput = state.validation.hasPositiveInput
  const debouncedValidationErrors = useDebounce(state.validation.errors, 200)
  const validationError = useMemo(
    () => getPrimaryValidationError(debouncedValidationErrors),
    [debouncedValidationErrors],
  )

  const previewLoading = Boolean(preview?.loading)

  const nextTokenToApprove = useMemo(
    () =>
      state.tokenInput.tokens.find(token => {
        const approvalState = approval.tokenApproval.states[token.address]

        return approvalState === APPROVAL_STATE.NOT_APPROVED
      }),
    [approval.tokenApproval.states, state.tokenInput.tokens],
  )

  const tokenApprovalPending = useMemo(
    () =>
      Boolean(
        approval.tokenApproval.addressToApprove ||
          Object.values(approval.tokenApproval.states).some(state => state === APPROVAL_STATE.PENDING),
      ),
    [approval.tokenApproval.addressToApprove, approval.tokenApproval.states],
  )

  const isApprovalLoading = approval.tokenApproval.loading || tokenApprovalPending
  const needsApprovalAction = Boolean(nextTokenToApprove)

  const primaryActionText = useMemo(() => {
    if (!account) return 'Connect Wallet'
    if (walletChainId !== poolChainId) {
      return `Switch to ${NETWORKS_INFO[poolChainId as keyof typeof NETWORKS_INFO]?.name || poolChainId}`
    }

    if (tokenApprovalPending) return 'Approving...'
    if (previewLoading) return 'Building...'
    if (validationError) return validationError

    if (nextTokenToApprove) return `Approve ${nextTokenToApprove.symbol}`
    if (routeLoading) return 'Fetching Route...'
    if (!route && hasPositiveInput && !validationError && !routeLoading) return 'No route found'
    if (isZapImpactBlocked) return 'Zap anyway'

    return 'Preview'
  }, [
    account,
    hasPositiveInput,
    isZapImpactBlocked,
    nextTokenToApprove,
    poolChainId,
    previewLoading,
    route,
    routeLoading,
    tokenApprovalPending,
    validationError,
    walletChainId,
  ])

  const primaryActionVariant = isZapImpactBlocked && !needsApprovalAction ? 'error' : 'primary'
  const isPrimaryActionDisabled =
    !!account &&
    walletChainId === poolChainId &&
    (Boolean(validationError) || isApprovalLoading || previewLoading || (routeLoading && !route))

  const runPrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!hasPositiveInput || validationError || !route || routeLoading) return

    if (nextTokenToApprove) {
      await approval.tokenApproval.approve(nextTokenToApprove.address)
      return
    }

    if (isZapImpactBlocked) {
      onOpenSettings?.()
      return
    }

    await preview?.onPreview?.()
  }

  const handlePrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (walletChainId !== poolChainId) {
      await changeNetwork(
        poolChainId,
        () => {
          void runPrimaryAction()
        },
        undefined,
        true,
      )
      return
    }

    await runPrimaryAction()
  }

  return {
    primaryActionText,
    primaryActionVariant,
    isPrimaryActionDisabled,
    handlePrimaryAction,
  }
}
