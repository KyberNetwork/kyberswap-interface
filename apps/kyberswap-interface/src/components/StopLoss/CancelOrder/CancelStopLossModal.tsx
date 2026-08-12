import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import {
  useBatchCancelStopLossOrdersMutation,
  useCancelStopLossOrderMutation,
  useGetStopLossBatchCancelSignMessageMutation,
  useGetStopLossCancelSignMessageMutation,
} from 'services/stopLoss'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import { StopLossOrder } from 'components/StopLoss/types'
import { stripEmptyEip712Salt } from 'components/StopLoss/utils'
import { useActiveWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { friendlyError } from 'utils/errorMessage'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type Props = {
  /** One order for a row cancel, or the whole active set for Cancel All. Empty closes the modal. */
  orders: StopLossOrder[]
  /** Named in the batch copy, because one signature can only reach one chain. */
  chainName?: string
  /** True when open orders on other chains are on screen but outside this batch. */
  hasOtherChains?: boolean
  onDismiss: () => void
  onCancelled: (orderIds: number[]) => void
}

const CancelStopLossModal = ({ orders, chainName, hasOtherChains, onDismiss, onCancelled }: Props) => {
  const { account } = useActiveWeb3React()
  const notify = useNotify()
  const tracking = useStopLossTracking()

  const [getCancelSignMessage] = useGetStopLossCancelSignMessageMutation()
  const [cancelOrder] = useCancelStopLossOrderMutation()
  const [getBatchSignMessage] = useGetStopLossBatchCancelSignMessageMutation()
  const [batchCancel] = useBatchCancelStopLossOrdersMutation()

  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState('')

  const isBatch = orders.length > 1
  const order = orders[0]

  const handleDismiss = () => {
    setError('')
    onDismiss()
  }

  const onConfirm = async () => {
    if (!order || !account) return
    setIsCancelling(true)
    setError('')

    try {
      // A batch covers one chain and one order type, so it is keyed off the first order's chain.
      const chainId = order.chainId
      let cancelledIds: number[]

      if (isBatch) {
        const orderIds = orders.map(o => o.id)
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
        orders.filter(o => cancelledIds.includes(o.id)).forEach(tracking.trackOrderCancelled)
        onCancelled(cancelledIds)
      }
      handleDismiss()
    } catch (cancelError) {
      setError(friendlyError(cancelError))
    } finally {
      setIsCancelling(false)
    }
  }

  const orderCount = orders.length

  return (
    <Modal isOpen={orders.length > 0} onDismiss={handleDismiss} maxWidth={420} borderRadius={16}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4" data-testid="stop-loss-cancel-modal">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium text-text" data-testid="stop-loss-cancel-title">
            {isBatch ? <Trans>Cancel All Stop-Loss Orders</Trans> : <Trans>Cancel Stop-Loss Order</Trans>}
          </div>
          <CloseIcon onClick={handleDismiss} data-testid="stop-loss-cancel-close" />
        </HStack>

        <span className="text-sm font-medium text-subText" data-testid="stop-loss-cancel-description">
          {isBatch ? (
            <Trans>
              Cancel {orderCount} stop-loss orders on {chainName} with a single signature? You can recreate them
              anytime, and cancelling costs no gas.
            </Trans>
          ) : (
            <Trans>Cancel this stop-loss order? You can recreate it anytime, and cancelling costs no gas.</Trans>
          )}
        </span>

        {isBatch && hasOtherChains && (
          <span className="text-xs font-medium italic text-warning" data-testid="stop-loss-cancel-other-chains-note">
            <Trans>Orders on other chains are not included — one signature covers a single chain.</Trans>
          </span>
        )}

        <span className="min-h-4 text-xs leading-4 text-red" data-testid="stop-loss-cancel-error">
          {error}
        </span>

        <HStack className="gap-3">
          <ButtonOutlined
            onClick={handleDismiss}
            className="flex-1"
            disabled={isCancelling}
            data-testid="stop-loss-cancel-keep-button"
          >
            <Trans>Keep Order</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={onConfirm}
            className="flex-1"
            disabled={isCancelling}
            data-testid="stop-loss-cancel-confirm-button"
          >
            {isCancelling ? <Trans>Cancelling...</Trans> : <Trans>Gas-less Cancel</Trans>}
          </ButtonPrimary>
        </HStack>
      </Stack>
    </Modal>
  )
}

export default CancelStopLossModal
