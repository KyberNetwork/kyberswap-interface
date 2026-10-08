import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import {
  useBatchCancelStopLossOrdersMutation,
  useCancelStopLossOrderMutation,
  useGetStopLossBatchCancelSignMessageMutation,
  useGetStopLossCancelSignMessageMutation,
} from 'services/stopLoss'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ChainFilter } from 'components/LimitOrder/CancelOrder/components'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import { StopLossOrder } from 'components/StopLoss/types'
import { stripEmptyEip712Salt } from 'components/StopLoss/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { friendlyError } from 'utils/errorMessage'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

/** The service signs at most 100 ids into one CancelBatchOrders message. */
const BATCH_CANCEL_LIMIT = 100

type Props = {
  /** One order for a row cancel, or every cancellable order on screen for Cancel All. Empty closes the modal. */
  orders: StopLossOrder[]
  isCancelAll: boolean
  onDismiss: () => void
  onCancelled: (orderIds: number[]) => void
}

/** The only way a stop-loss is cancelled: a signed message, so there is nothing to choose between. */
const GaslessCancelNote = ({ isCancelAll }: { isCancelAll: boolean }) => (
  <Stack
    className="gap-1 rounded-xl border border-primary-50 bg-primary-20 px-4 py-3"
    data-testid="stop-loss-cancel-method"
  >
    <span className="text-sm font-medium text-text">
      {isCancelAll ? <Trans>Gas-less Cancel All Orders</Trans> : <Trans>Gas-less Cancel</Trans>}
    </span>
    <span className="text-xs italic text-subText">
      {isCancelAll ? (
        <Trans>Cancel by signing a message, without paying gas. You can recreate the orders anytime.</Trans>
      ) : (
        <Trans>Cancel by signing a message, without paying gas. You can recreate the order anytime.</Trans>
      )}
    </span>
  </Stack>
)

const CancelStopLossModal = ({ orders, isCancelAll, onDismiss, onCancelled }: Props) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const notify = useNotify()
  const tracking = useStopLossTracking()
  const { changeNetwork } = useChangeNetwork()

  const [getCancelSignMessage] = useGetStopLossCancelSignMessageMutation()
  const [cancelOrder] = useCancelStopLossOrderMutation()
  const [getBatchSignMessage] = useGetStopLossBatchCancelSignMessageMutation()
  const [batchCancel] = useBatchCancelStopLossOrdersMutation()

  const [isCancelling, setIsCancelling] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [error, setError] = useState('')
  const [pickedChainId, setPickedChainId] = useState<ChainId>()

  /**
   * One signature reaches one chain, so Cancel All asks which chain to clear rather than leaving the
   * others behind unannounced. Busiest chain first; the wallet's chain is preselected when it has
   * orders, since signing there needs no network switch.
   */
  const chainOptions = useMemo(() => {
    const counts = new Map<ChainId, number>()
    orders.forEach(order => counts.set(order.chainId, (counts.get(order.chainId) || 0) + 1))
    return Array.from(counts.entries())
      .map(([chainId, count]) => ({ chainId, count }))
      .sort((a, b) => b.count - a.count)
  }, [orders])
  const selectedChainId =
    pickedChainId ?? chainOptions.find(option => option.chainId === walletChainId)?.chainId ?? chainOptions[0]?.chainId
  const selectedOrders = useMemo(
    () =>
      isCancelAll ? orders.filter(order => order.chainId === selectedChainId).slice(0, BATCH_CANCEL_LIMIT) : orders,
    [isCancelAll, orders, selectedChainId],
  )
  const showChainPicker = isCancelAll && chainOptions.length > 1

  const isBatch = selectedOrders.length > 1
  const order = selectedOrders[0]

  // The cancel message is signed for the orders' chain, which a wallet on another chain refuses — so,
  // as the limit-order modal does, the confirm button first offers to switch.
  const shouldSwitchNetwork = !!order && walletChainId !== order.chainId
  const onSwitchNetwork = async () => {
    if (!order) return
    setError('')
    setIsSwitchingNetwork(true)
    try {
      await changeNetwork(order.chainId)
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const handleDismiss = () => {
    setError('')
    setPickedChainId(undefined)
    onDismiss()
  }

  const onConfirm = async () => {
    if (!order || !account) return
    setIsCancelling(true)
    setError('')

    try {
      // A batch covers one chain and one order type, which the chain picker guarantees.
      const chainId = order.chainId
      let cancelledIds: number[]

      if (isBatch) {
        const orderIds = selectedOrders.map(o => o.id)
        const params = { chainId, userWallet: account, orderIds }
        const typedData = await getBatchSignMessage(params).unwrap()
        const rawSignature = await signTypedDataRaw({
          chainId,
          account: account as Address,
          typedData: stripEmptyEip712Salt(typedData),
        })
        const results = await batchCancel({ ...params, signature: formatSignature(rawSignature) }).unwrap()

        // A verified signature still returns success, so a per-order failure is only visible here.
        cancelledIds = results.filter(result => result.success).map(result => result.orderId)
        const failed = results.filter(result => !result.success)
        if (failed.length) {
          const count = failed.length
          notify(
            {
              type: NotificationType.WARNING,
              title: t`Some orders were not cancelled`,
              summary: t`${count} of the selected orders could not be cancelled — they may have executed already.`,
            },
            10000,
          )
        }
      } else {
        const params = { chainId, userWallet: account, orderId: order.id }
        const typedData = await getCancelSignMessage(params).unwrap()
        const rawSignature = await signTypedDataRaw({
          chainId,
          account: account as Address,
          typedData: stripEmptyEip712Salt(typedData),
        })
        await cancelOrder({ ...params, signature: formatSignature(rawSignature) }).unwrap()
        cancelledIds = [order.id]
      }

      if (cancelledIds.length) {
        const count = cancelledIds.length
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Order cancelled`,
            summary: isBatch ? t`${count} stop-loss orders were cancelled.` : t`Your stop-loss order was cancelled.`,
          },
          10000,
        )
        selectedOrders.filter(o => cancelledIds.includes(o.id)).forEach(tracking.trackOrderCancelled)
        onCancelled(cancelledIds)
      }
      handleDismiss()
    } catch (cancelError) {
      setError(friendlyError(cancelError))
    } finally {
      setIsCancelling(false)
    }
  }

  const orderCount = selectedOrders.length

  return (
    <Modal isOpen={orders.length > 0} onDismiss={handleDismiss} maxWidth={480} borderRadius={16}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4" data-testid="stop-loss-cancel-modal">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium text-text" data-testid="stop-loss-cancel-title">
            {isCancelAll ? <Trans>Bulk Cancellation</Trans> : <Trans>Cancel Stop-Loss Order</Trans>}
          </div>
          <CloseIcon onClick={handleDismiss} data-testid="stop-loss-cancel-close" />
        </HStack>

        {showChainPicker && (
          <ChainFilter
            options={chainOptions}
            selectedChainId={selectedChainId}
            totalOrders={orders.length}
            disabled={isCancelling || isSwitchingNetwork}
            onChange={chainId => {
              setError('')
              setPickedChainId(chainId)
            }}
          />
        )}

        <span className="font-medium text-text" data-testid="stop-loss-cancel-description">
          {isCancelAll ? (
            <Trans>Are you sure you want to cancel {orderCount} stop-loss orders?</Trans>
          ) : (
            <Trans>Are you sure you want to cancel this stop-loss order?</Trans>
          )}
        </span>

        <GaslessCancelNote isCancelAll={isCancelAll} />

        {error && (
          <span className="text-xs leading-4 text-red" data-testid="stop-loss-cancel-error">
            {error}
          </span>
        )}

        <HStack className="gap-3">
          {showChainPicker && (
            <ButtonOutlined
              onClick={handleDismiss}
              className="flex-1"
              disabled={isCancelling}
              data-testid="stop-loss-cancel-back-button"
            >
              <Trans>Back</Trans>
            </ButtonOutlined>
          )}
          <ButtonPrimary
            onClick={shouldSwitchNetwork ? onSwitchNetwork : onConfirm}
            className="flex-1"
            disabled={isCancelling || isSwitchingNetwork || !order}
            data-testid="stop-loss-cancel-confirm-button"
          >
            {shouldSwitchNetwork && order ? (
              <Trans>Switch to {NETWORKS_INFO[order.chainId].name}</Trans>
            ) : isCancelling ? (
              <Trans>Cancelling...</Trans>
            ) : isCancelAll ? (
              <Trans>Cancel Orders</Trans>
            ) : (
              <Trans>Cancel Order</Trans>
            )}
          </ButtonPrimary>
        </HStack>
      </Stack>
    </Modal>
  )
}

export default CancelStopLossModal
