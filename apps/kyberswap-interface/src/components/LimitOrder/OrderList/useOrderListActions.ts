import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { LimitOrder } from 'components/LimitOrder/types'
import { STOP_MARKET_DEFAULT_EXPIRE, getStopMarketExpiryPresets } from 'components/StopMarket/constants'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { StopMarket } from 'components/StopMarket/types'
import { getStopMarketDisplayStatus, getStopMarketRecreateDraft } from 'components/StopMarket/utils'
import { APP_PATHS, ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO, isSupportLimitOrder, isSupportStopMarket, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useAppDispatch } from 'state/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { updateStopMarketForm } from 'state/stopMarket/reducer'

/** Cross-panel intents live with the panel, while rows only report the selected order. */
export const useOrderListActions = () => {
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { chainId: limitChainId } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const { setInputValue } = useLimitActionHandlers()
  const { search } = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const tracking = useStopMarketTracking()
  const { changeNetwork } = useChangeNetwork()
  const actionId = useRef(0)

  // Switching network is part of the intent; changing account or unmounting the panel cancels its continuation.
  useEffect(
    () => () => {
      actionId.current += 1
    },
    [account],
  )

  const onTargetChain = (targetChain: ChainId, currentChain: ChainId, onReady: () => void) => {
    const id = ++actionId.current
    const complete = () => {
      if (id !== actionId.current) return
      actionId.current += 1
      onReady()
    }
    if (targetChain === currentChain) complete()
    else changeNetwork(targetChain, complete)
  }

  const onSelectLimitPair = (order: LimitOrder) => {
    if (!isSupportedChainId(order.chainId) || !isSupportLimitOrder(order.chainId)) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const isCurrentPair =
      order.chainId === limitChainId &&
      currencyIn?.wrapped.address.toLowerCase() === order.makerAsset.toLowerCase() &&
      currencyOut?.wrapped.address.toLowerCase() === order.takerAsset.toLowerCase()
    if (isCurrentPair) {
      actionId.current += 1
      return
    }

    onTargetChain(order.chainId, limitChainId, () => {
      navigate(
        `${APP_PATHS.LIMIT}/${NETWORKS_INFO[order.chainId].route}/${order.makerAsset}-to-${order.takerAsset}${search}`,
      )
    })
  }

  const onSelectStopPair = (order: StopMarket) => {
    if (!isSupportStopMarket(order.chainId)) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const inputAddress = currencyIn?.isNative ? ETHER_ADDRESS : currencyIn?.wrapped.address
    const outputAddress = currencyOut?.isNative ? ETHER_ADDRESS : currencyOut?.wrapped.address
    const isCurrentPair =
      order.chainId === walletChainId &&
      inputAddress?.toLowerCase() === order.tokenIn.toLowerCase() &&
      outputAddress?.toLowerCase() === order.tokenOut.toLowerCase()
    if (isCurrentPair) {
      actionId.current += 1
      return
    }

    onTargetChain(order.chainId, walletChainId, () => {
      navigate(
        `${APP_PATHS.STOP_MARKET}/${NETWORKS_INFO[order.chainId].route}/${order.tokenIn}-to-${order.tokenOut}${search}`,
      )
    })
  }

  const onRecreateStopOrder = (order: StopMarket, sellAmount: string) => {
    tracking.trackRecreateClicked(order, getStopMarketDisplayStatus(order))
    onTargetChain(order.chainId, walletChainId, () => {
      setInputValue(sellAmount)
      dispatch(
        updateStopMarketForm({
          ...getStopMarketRecreateDraft(order, {
            expiryPresets: getStopMarketExpiryPresets().map(preset => preset.value),
            defaultExpire: STOP_MARKET_DEFAULT_EXPIRE,
            now: Date.now(),
          }),
        }),
      )
      navigate(
        `${APP_PATHS.STOP_MARKET}/${NETWORKS_INFO[order.chainId].route}/${order.tokenIn}-to-${
          order.tokenOut
        }?tab=limit`,
      )
    })
  }

  return { onSelectLimitPair, onSelectStopPair, onRecreateStopOrder }
}
