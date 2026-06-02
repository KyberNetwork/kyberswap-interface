import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { useMedia } from 'react-use'

import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/AddMEVProtectionModal'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export const PriceAlertButton = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) => (
  <div
    onClick={onClick}
    className={cn(
      'flex cursor-pointer select-none items-center gap-1 rounded-3xl bg-subText-20 px-1.5 py-1 text-xs font-medium',
      className,
    )}
  >
    {children}
  </div>
)

export default function SlippageSettingGroup({ isWrapOrUnwrap }: { isWrapOrUnwrap: boolean }) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const { chainId } = useActiveWeb3React()
  const { active } = useWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const { trackingHandler } = useTracking()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    trackingHandler(TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV)
  }, [trackingHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const rightButton =
    KYBER_SWAP_RPC[chainId] && active && !isPartnerSwap && !isMobile && !isTablet ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} className="text-subText" />
        <span className="whitespace-nowrap text-subText">
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
          <InfoHelper size={14} text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>} />
        </span>
      </PriceAlertButton>
    ) : null

  return (
    <div className="flex items-start justify-between text-xs text-subText">
      {isWrapOrUnwrap || !isSlippageControlPinned ? (
        <>
          <div />
          {rightButton}
        </>
      ) : (
        <SlippageSetting rightComponent={rightButton} />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </div>
  )
}
