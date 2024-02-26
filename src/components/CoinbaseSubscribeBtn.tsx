import React, { useCallback, useEffect, useMemo } from 'react'
import { Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { useActiveWeb3React } from 'hooks'
import { setCoinbaseIsSubscribed, setCoinbaseLoading, setCoinbaseScriptLoaded } from 'state/application/actions'
import { useAppDispatch, useAppSelector } from 'state/hooks'

export default function CoinbaseSubscribeBtn({ onlyShowIfNotSubscribe = false }: { onlyShowIfNotSubscribe?: boolean }) {
  const { walletKey } = useActiveWeb3React()

  const isCoinbase = walletKey === 'COINBASE'

  const { isSubscribed, isLoading, isScriptLoaded } = useAppSelector(state => state.application.coinbaseSubscribe)
  const dispatch = useAppDispatch()

  const setIsSubscribed = useCallback(
    (val: boolean) => {
      dispatch(setCoinbaseIsSubscribed(val))
    },
    [dispatch],
  )

  const setIsLoading = useCallback(
    (val: boolean) => {
      dispatch(setCoinbaseLoading(val))
    },
    [dispatch],
  )

  const subscribeButtonText = useMemo(() => {
    if (isLoading) return 'Loading...'
    return isSubscribed ? 'Unsubscribe' : 'Subscribe'
  }, [isLoading, isSubscribed])

  const handleSubscribe = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    ;(window as any)?.CBWSubscribe.toggleSubscription()
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    if (isCoinbase && !isScriptLoaded) {
      script.src = 'https://broadcast.coinbase.com/subscribe-button.js'
      script.async = true
      document.body.appendChild(script)
      script.onload = () => {
        dispatch(setCoinbaseScriptLoaded(true))
        ;(window as any).CBWSubscribe.createSubscriptionUI({
          partnerAddress: '0xa0F3873866D6fDDCaF02C181b55605F962dD327b',
          partnerName: 'KyberSwap',
          modalTitle: 'Subscribe to KyberSwap updates',
          modalBody:
            'Receive the latest updates, promotions, and alerts directly in your wallet! <br /> <br/> Powered by Coinbase',
          buttonText: 'Sign to Subscribe',
          onSubscriptionChange: setIsSubscribed,
          onLoading: setIsLoading,
        })
      }
    }
  }, [isCoinbase, isScriptLoaded, dispatch, setIsLoading, setIsSubscribed])

  if (!isCoinbase || (isSubscribed && onlyShowIfNotSubscribe)) return null

  return (
    <Text onClick={handleSubscribe} sx={{ cursor: 'pointer', color: '#2C9CE4' }} role="button" fontSize={14}>
      {subscribeButtonText}
      {!isLoading && (
        <InfoHelper
          color="#2C9CE4"
          size={13}
          text={
            !isSubscribed
              ? "Subscribe to receive Kyberswap's updates directly on your Coinbase Wallet."
              : "Unsubscribe to stop receiving Kyberswap's updates directly on your Coinbase Wallet."
          }
        />
      )}
    </Text>
  )
}
