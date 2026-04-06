import { APPROVAL_STATE, useDebounce } from '@kyber/hooks'
import { useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ApprovalState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useApproval'
import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getPrimaryValidationError } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { useWalletModalToggle } from 'state/application/hooks'

type UseZapActionsProps = {
  state: ZapState
  approval: ApprovalState
  poolChainId: number
  isZapImpactBlocked: boolean
  isHighZapImpact?: boolean
  onOpenSettings?: () => void
  preview?: {
    loading?: boolean
    onPreview?: () => Promise<void>
  }
}

export const useZapActions = ({
  state,
  approval,
  poolChainId,
  isZapImpactBlocked,
  isHighZapImpact,
  onOpenSettings,
  preview,
}: UseZapActionsProps) => {
  const { account } = useActiveWeb3React()
  const { chainId: walletChainId } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()

  const route = state.route.data
  const routeError = state.route.error
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

  const primaryActionText = useMemo(() => {
    if (!account) return 'Connect Wallet'
    if (walletChainId !== poolChainId) {
      return `Switch to ${NETWORKS_INFO[poolChainId as keyof typeof NETWORKS_INFO]?.name || poolChainId}`
    }

    if (tokenApprovalPending) return 'Approving...'
    if (previewLoading) return 'Building...'
    if (validationError) return validationError

    if (nextTokenToApprove) return `Approve ${nextTokenToApprove.symbol}`
    if (isZapImpactBlocked) return 'Zap Anyway'
    if (routeLoading && !route) return 'Fetching Route...'
    if (routeError) return 'No route found'
    if (!route && hasPositiveInput && !validationError && !routeLoading) return 'No route found'
    if (isHighZapImpact) return 'Zap Anyway'

    return 'Preview'
  }, [
    account,
    hasPositiveInput,
    isZapImpactBlocked,
    isHighZapImpact,
    nextTokenToApprove,
    poolChainId,
    previewLoading,
    route,
    routeError,
    routeLoading,
    tokenApprovalPending,
    validationError,
    walletChainId,
  ])

  const primaryActionVariant = !nextTokenToApprove && (isZapImpactBlocked || isHighZapImpact) ? 'error' : 'primary'
  const isPrimaryActionDisabled =
    !!account &&
    walletChainId === poolChainId &&
    (Boolean(validationError) ||
      isApprovalLoading ||
      previewLoading ||
      (routeLoading && !route) ||
      Boolean(routeError) ||
      (!route && hasPositiveInput))

  const runPrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!hasPositiveInput || validationError || !route || routeError) return

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
      await changeNetwork(poolChainId, undefined, undefined, true)
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
