import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCancelAllStopMarketsMutation,
  useCancelStopMarketMutation,
  useGetStopMarketCancelAllSignMessageMutation,
  useGetStopMarketCancelSignMessageMutation,
  useGetStopMarketsQuery,
} from 'services/stopMarket'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { ChainFilter } from 'components/LimitOrder/CancelOrder/components'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { StopMarket, StopMarketStatus } from 'components/StopMarket/types'
import { stripEmptyEip712Salt } from 'components/StopMarket/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { friendlyError } from 'utils/errorMessage'
import { formatSignature } from 'utils/transaction'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

type Props = {
  /**
   * One order for a row cancel. For Cancel All, the open orders in hand: they name the chains to offer
   * and leave the table as soon as the cancel lands, while the cancel itself covers every open order
   * on the chosen chain, listed here or not. Empty closes the modal.
   */
  orders: StopMarket[]
  isCancelAll: boolean
  onDismiss: () => void
  onCancelled: (orderIds: number[]) => void
}

/** The only way a stop market order is cancelled: a signed message, so there is nothing to choose between. */
const GaslessCancelNote = ({ isCancelAll }: { isCancelAll: boolean }) => (
  <Stack
    className="gap-1 rounded-xl border border-primary-50 bg-primary-20 px-4 py-3"
    data-testid="stop-market-cancel-method"
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

const CancelStopMarketModal = ({ orders, isCancelAll, onDismiss, onCancelled }: Props) => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const notify = useNotify()
  const tracking = useStopMarketTracking()
  const { changeNetwork } = useChangeNetwork()

  const [getCancelSignMessage] = useGetStopMarketCancelSignMessageMutation()
  const [cancelOrder] = useCancelStopMarketMutation()
  const [getCancelAllSignMessage] = useGetStopMarketCancelAllSignMessageMutation()
  const [cancelAll] = useCancelAllStopMarketsMutation()

  const [isCancelling, setIsCancelling] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [error, setError] = useState('')
  const [pickedChainId, setPickedChainId] = useState<ChainId>()
  const requestController = useRef(new AbortController())
  const isOpen = orders.length > 0

  useEffect(() => {
    requestController.current = new AbortController()
    setIsCancelling(false)
    setIsSwitchingNetwork(false)
    setError('')
    setPickedChainId(undefined)
    return () => requestController.current.abort()
  }, [account, isOpen])

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
    () => (isCancelAll ? orders.filter(order => order.chainId === selectedChainId) : orders),
    [isCancelAll, orders, selectedChainId],
  )
  const showChainPicker = isCancelAll && chainOptions.length > 1

  const order = selectedOrders[0]
  const targetChainId = isCancelAll ? selectedChainId : order?.chainId

  // How many the cancel will reach, asked of the service: the orders in hand are the newest hundred,
  // which a wallet with more open orders on the chain would exceed.
  const { currentData: openOnChain } = useGetStopMarketsQuery(
    {
      userWallet: account || '',
      chainIds: targetChainId ? [targetChainId] : undefined,
      statuses: [StopMarketStatus.OPEN],
      page: 1,
      pageSize: 1,
    },
    { skip: !isCancelAll || !account || !targetChainId || orders.length === 0 },
  )
  const orderCount = isCancelAll ? openOnChain?.totalItems ?? selectedOrders.length : selectedOrders.length

  // The cancel message is signed for the orders' chain, which a wallet on another chain refuses — so,
  // as the limit-order modal does, the confirm button first offers to switch.
  const shouldSwitchNetwork = !!targetChainId && walletChainId !== targetChainId
  const onSwitchNetwork = async () => {
    if (!targetChainId) return
    setError('')
    setIsSwitchingNetwork(true)
    const signal = requestController.current.signal
    try {
      await changeNetwork(targetChainId)
    } finally {
      if (!signal.aborted) setIsSwitchingNetwork(false)
    }
  }

  const handleDismiss = () => {
    requestController.current.abort()
    setError('')
    setPickedChainId(undefined)
    onDismiss()
  }

  const onConfirm = async () => {
    if (!targetChainId || !account || isCancelling) return
    const signal = requestController.current.signal
    if (signal.aborted) return
    setIsCancelling(true)
    setError('')

    try {
      const chainId = targetChainId
      if (isCancelAll) {
        const params = { chainId, userWallet: account }
        const typedData = await getCancelAllSignMessage(params).unwrap()
        if (signal.aborted) return
        const rawSignature = await signTypedDataRaw({
          chainId,
          account: account as Address,
          typedData: stripEmptyEip712Salt(typedData),
        })
        if (signal.aborted) return
        // The service checks the signature against the moment it issued, so that travels back with it.
        await cancelAll({
          ...params,
          issuedAt: String(typedData.message.issuedAt ?? ''),
          signature: formatSignature(rawSignature),
        }).unwrap()
      } else {
        if (!order) return
        const params = { chainId, userWallet: account, orderId: order.id }
        const typedData = await getCancelSignMessage(params).unwrap()
        if (signal.aborted) return
        const rawSignature = await signTypedDataRaw({
          chainId,
          account: account as Address,
          typedData: stripEmptyEip712Salt(typedData),
        })
        if (signal.aborted) return
        await cancelOrder({ ...params, signature: formatSignature(rawSignature) }).unwrap()
      }

      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order cancelled`,
          summary: isCancelAll
            ? t`${orderCount} Stop Market orders were cancelled.`
            : t`Your Stop Market order was cancelled.`,
        },
        10000,
      )
      selectedOrders.forEach(tracking.trackOrderCancelled)
      // Submitted cancellations still invalidate cache and report success for their original orders.
      // Only callbacks into the current UI are suppressed after dismissal or a wallet change.
      if (signal.aborted) return
      onCancelled(selectedOrders.map(o => o.id))
      handleDismiss()
    } catch (cancelError) {
      if (!signal.aborted) setError(friendlyError(cancelError))
    } finally {
      if (!signal.aborted) setIsCancelling(false)
    }
  }

  return (
    <Modal isOpen={orders.length > 0} onDismiss={handleDismiss} maxWidth={480} borderRadius={16}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4" data-testid="stop-market-cancel-modal">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium text-text" data-testid="stop-market-cancel-title">
            {isCancelAll ? <Trans>Bulk Cancellation</Trans> : <Trans>Cancel Stop Market Order</Trans>}
          </div>
          <CloseIcon onClick={handleDismiss} data-testid="stop-market-cancel-close" />
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

        <span className="font-medium text-text" data-testid="stop-market-cancel-description">
          {isCancelAll ? (
            <Trans>Are you sure you want to cancel {orderCount} Stop Market orders?</Trans>
          ) : (
            <Trans>Are you sure you want to cancel this Stop Market order?</Trans>
          )}
        </span>

        <GaslessCancelNote isCancelAll={isCancelAll} />

        {error && (
          <span className="text-xs leading-4 text-red" data-testid="stop-market-cancel-error">
            {error}
          </span>
        )}

        <HStack className="gap-3">
          {showChainPicker && (
            <ButtonOutlined
              onClick={handleDismiss}
              className="flex-1"
              disabled={isCancelling}
              data-testid="stop-market-cancel-back-button"
            >
              <Trans>Back</Trans>
            </ButtonOutlined>
          )}
          <ButtonPrimary
            onClick={shouldSwitchNetwork ? onSwitchNetwork : onConfirm}
            className="flex-1"
            disabled={isCancelling || isSwitchingNetwork || !targetChainId}
            data-testid="stop-market-cancel-confirm-button"
          >
            {shouldSwitchNetwork && targetChainId ? (
              <Trans>Switch to {NETWORKS_INFO[targetChainId].name}</Trans>
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

export default CancelStopMarketModal
