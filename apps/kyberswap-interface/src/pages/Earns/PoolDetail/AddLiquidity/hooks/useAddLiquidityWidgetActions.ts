import { Pool, TxStatus, ZapRouteDetail } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { NavigateFunction } from 'react-router-dom'
import { BuildZapInData } from 'services/zapInService'

import { NETWORKS_INFO } from 'constants/networks'
import useAddLiquidityApproval from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityApproval'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { TRANSACTION_TYPE } from 'state/transactions/type'

interface BuildRouteParams {
  chainId: number
  sender: string
  recipient: string
  route: unknown
  deadline: number
  permits?: Record<string, string>
  source: string
  referral?: string
}

interface UseAddLiquidityWidgetActionsWallet {
  account?: string
  chainId?: ChainId
  walletChainId?: number
  library?: any
  toggleWalletModal: () => void
  changeNetwork: (
    chainId: number,
    callback?: (() => void) | undefined,
    onError?: (() => void) | undefined,
    request?: boolean | undefined,
  ) => Promise<void>
}

interface UseAddLiquidityWidgetActionsRoute {
  exchange?: Exchange
  poolAddress?: string
  positionId?: string
  deadline?: number
  referral?: string
  route?: ZapRouteDetail | null
  routeLoading?: boolean
  pool?: Pool | null
  buildRouteLoading?: boolean
  buildZapInRoute: (args: BuildRouteParams) => { unwrap: () => Promise<BuildZapInData> }
}

interface UseAddLiquidityWidgetActionsForm {
  approval: ReturnType<typeof useAddLiquidityApproval>
  hasPositiveInput?: boolean
  validationError?: string
  isZapImpactBlocked?: boolean
  parsedTokensIn: Array<{ symbol?: string; logoUrl?: string; amount: string }>
}

interface UseAddLiquidityWidgetActionsTransactions {
  originalToCurrentHash: Record<string, string>
  txStatusMap: Record<string, TxStatus>
  clearTracking: () => void
  addTrackedTxHash: (hash: string) => void
  addTransactionWithType: (transaction: any) => void
}

interface UseAddLiquidityWidgetActionsProps {
  wallet: UseAddLiquidityWidgetActionsWallet
  routeState: UseAddLiquidityWidgetActionsRoute
  formState: UseAddLiquidityWidgetActionsForm
  transactionState: UseAddLiquidityWidgetActionsTransactions
  navigate: NavigateFunction
}

export default function useAddLiquidityWidgetActions({
  wallet,
  routeState,
  formState,
  transactionState,
  navigate,
}: UseAddLiquidityWidgetActionsProps) {
  const { account, chainId, walletChainId, library, toggleWalletModal, changeNetwork } = wallet
  const {
    exchange,
    poolAddress,
    positionId,
    deadline,
    referral,
    route,
    routeLoading = false,
    pool,
    buildRouteLoading = false,
    buildZapInRoute,
  } = routeState
  const {
    approval,
    hasPositiveInput = false,
    validationError = '',
    isZapImpactBlocked = false,
    parsedTokensIn,
  } = formState
  const { originalToCurrentHash, txStatusMap, clearTracking, addTrackedTxHash, addTransactionWithType } =
    transactionState
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedTxHash, setSubmittedTxHash] = useState('')
  const [buildData, setBuildData] = useState<BuildZapInData | null>(null)
  const currentTxHash = submittedTxHash ? originalToCurrentHash[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatusMap[submittedTxHash] || txStatusMap[currentTxHash] : undefined
  const modalTxStatus: '' | 'success' | 'failed' | 'cancelled' =
    currentTxStatus === TxStatus.SUCCESS
      ? 'success'
      : currentTxStatus === TxStatus.FAILED
      ? 'failed'
      : currentTxStatus === TxStatus.CANCELLED
      ? 'cancelled'
      : ''
  const isPreviewLoading = routeLoading || buildRouteLoading
  const isApprovalLoading =
    approval.tokenApprovalLoading ||
    approval.tokenApprovalPending ||
    approval.nftApprovalChecking ||
    approval.nftApprovalPending ||
    approval.permitState === 'signing'
  const needsApprovalAction =
    !!approval.nextTokenToApprove || approval.needsPermitSignature || approval.needsNftApproval
  const primaryActionText = useMemo(() => {
    if (!account) return 'Connect Wallet'
    if (walletChainId !== chainId && chainId) return `Switch to ${NETWORKS_INFO[chainId]?.name}`
    if (approval.tokenApprovalPending) return 'Approving...'
    if (approval.nextTokenToApprove) return `Approve ${approval.nextTokenToApprove.symbol}`
    if (approval.permitState === 'signing') return 'Signing...'
    if (approval.needsPermitSignature) return 'Permit NFT'
    if (approval.nftApprovalPending) return 'Approving NFT...'
    if (approval.nftApprovalChecking) return 'Checking NFT Approval...'
    if (approval.needsNftApproval) return 'Approve NFT'
    if (isZapImpactBlocked) return 'Zap anyway'
    if (isPreviewLoading) return 'Building...'
    return 'Preview'
  }, [
    account,
    approval.needsNftApproval,
    approval.needsPermitSignature,
    approval.nextTokenToApprove,
    approval.nftApprovalChecking,
    approval.nftApprovalPending,
    approval.permitState,
    approval.tokenApprovalPending,
    chainId,
    isZapImpactBlocked,
    isPreviewLoading,
    walletChainId,
  ])

  const buildPreview = async () => {
    if (!account || !chainId || !route || !deadline) return

    setSubmitError(null)
    setSubmittedTxHash('')
    clearTracking()
    setIsReviewOpen(true)

    try {
      const builtRoute = await buildZapInRoute({
        chainId,
        sender: account,
        recipient: account,
        route: route.route,
        deadline,
        permits:
          approval.permitData?.permitData && positionId
            ? {
                [positionId]: approval.permitData.permitData,
              }
            : undefined,
        source: 'kyberswap-earn',
        referral,
      }).unwrap()

      setBuildData(builtRoute)
    } catch (error) {
      setBuildData(null)
      setSubmitError(friendlyError(error as Error) || (error as Error)?.message || 'Failed to build zap transaction')
    }
  }

  const runPrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!hasPositiveInput || validationError || !route || routeLoading || !chainId) return

    if (approval.nextTokenToApprove) {
      await approval.approveToken(approval.nextTokenToApprove.address)
      return
    }

    if (approval.needsPermitSignature) {
      await approval.signPermit()
      return
    }

    if (approval.needsNftApproval) {
      await approval.approveNft()
      return
    }

    if (isZapImpactBlocked) return

    await buildPreview()
  }

  const handlePrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!chainId) return

    if (walletChainId !== chainId) {
      await changeNetwork(
        chainId,
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

  const handleDismissReview = () => {
    setIsReviewOpen(false)
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmittedTxHash('')
    setBuildData(null)
    clearTracking()
  }

  const handleSubmit = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!exchange || !chainId || !poolAddress || !route || !pool || !library) return

    setSubmitError(null)

    if (walletChainId !== chainId) {
      await changeNetwork(chainId, undefined, undefined, true)
      return
    }

    if (!buildData) {
      setSubmitError('Build route is unavailable.')
      return
    }

    setIsSubmitting(true)

    try {
      const { txHash, error } = await submitTransaction({
        library,
        txData: {
          from: account,
          to: buildData.routerAddress,
          data: buildData.callData,
          value: buildData.value,
        },
      })

      if (!txHash || error) {
        throw new Error(error?.message || 'Transaction failed')
      }

      setSubmittedTxHash(txHash)
      addTrackedTxHash(txHash)
      addTransactionWithType({
        hash: txHash,
        type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
        extraInfo: {
          pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
          tokensIn: parsedTokensIn,
          dexLogoUrl: EARN_DEXES[exchange].logo,
          dex: exchange,
        },
      })
    } catch (error) {
      setSubmitError(
        friendlyError(error as Error) || (error as Error)?.message || 'Failed to build or submit zap transaction',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewPosition = async () => {
    if (!library || !currentTxHash || !exchange || !poolAddress || !chainId) return

    await navigateToPositionAfterZap(library, currentTxHash, chainId, exchange, poolAddress, navigate)
    handleDismissReview()
  }

  return {
    isReviewOpen,
    isSubmitting,
    submitError,
    submittedTxHash,
    buildData,
    currentTxHash,
    modalTxStatus,
    isApprovalLoading,
    needsApprovalAction,
    primaryActionText,
    confirmDisabled: buildRouteLoading || isSubmitting || !buildData || isZapImpactBlocked,
    confirmLoading: buildRouteLoading || isSubmitting,
    handlePrimaryAction,
    handleDismissReview,
    handleSubmit,
    handleViewPosition,
  }
}
