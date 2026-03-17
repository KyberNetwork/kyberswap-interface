import { APPROVAL_STATE, PermitNftState, useDebounce } from '@kyber/hooks'
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
    onPreview?: (permitData?: string) => Promise<void>
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
  const { account, walletChainId, positionId, toggleWalletModal, changeNetwork } = useAddLiquidityRuntimeContext()

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

  const needsPermitSignature = Boolean(
    positionId &&
      route?.routerPermitAddress &&
      (approval.permit.state === PermitNftState.READY_TO_SIGN ||
        approval.permit.state === PermitNftState.ERROR ||
        approval.permit.state === PermitNftState.SIGNING),
  )

  const needsNftApproval = Boolean(
    positionId &&
      route?.routerAddress &&
      !needsPermitSignature &&
      !approval.nftApproval.isApproved &&
      approval.permit.state !== PermitNftState.SIGNED,
  )

  const isApprovalLoading =
    approval.tokenApproval.loading ||
    tokenApprovalPending ||
    approval.nftApproval.isChecking ||
    Boolean(approval.nftApproval.pendingTx) ||
    approval.permit.state === PermitNftState.SIGNING

  const needsApprovalAction = Boolean(nextTokenToApprove || needsPermitSignature || needsNftApproval)

  const primaryActionText = useMemo(() => {
    if (!account) return 'Connect Wallet'
    if (walletChainId !== poolChainId) {
      return `Switch to ${NETWORKS_INFO[poolChainId as keyof typeof NETWORKS_INFO]?.name || poolChainId}`
    }

    if (tokenApprovalPending) return 'Approving...'
    if (previewLoading) return 'Building...'
    if (validationError) return validationError

    if (nextTokenToApprove) return `Approve ${nextTokenToApprove.symbol}`
    if (approval.permit.state === PermitNftState.SIGNING) return 'Signing...'
    if (needsPermitSignature) return 'Permit NFT'
    if (approval.nftApproval.pendingTx) return 'Approving NFT...'
    if (approval.nftApproval.isChecking) return 'Checking NFT Approval...'
    if (needsNftApproval) return 'Approve NFT'
    if (routeLoading) return 'Fetching Route...'
    if (!route && hasPositiveInput && !validationError && !routeLoading) return 'No route found'
    if (isZapImpactBlocked) return 'Zap anyway'

    return 'Preview'
  }, [
    account,
    approval.nftApproval.isChecking,
    approval.nftApproval.pendingTx,
    approval.permit.state,
    hasPositiveInput,
    isZapImpactBlocked,
    needsNftApproval,
    needsPermitSignature,
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

    if (needsPermitSignature) {
      await approval.permit.sign()
      return
    }

    if (needsNftApproval) {
      await approval.nftApproval.approve()
      return
    }

    if (isZapImpactBlocked) {
      onOpenSettings?.()
      return
    }

    await preview?.onPreview?.(approval.permit.data?.permitData)
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
