import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { useMedia } from 'react-use'

import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/Settings/AddMEVProtectionModal'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import usePageLocation from 'hooks/usePageLocation'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const MEVProtection = ({ className, showTrigger = true }: { className?: string; showTrigger?: boolean }) => {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const { chainId } = useActiveWeb3React()
  const { active } = useWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const { trackingHandler } = useTracking()
  const { isEmbeddedSwap } = usePageLocation()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    trackingHandler(TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV)
  }, [trackingHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const canAddProtection = KYBER_SWAP_RPC[chainId] && active && !isEmbeddedSwap && !isMobile && !isTablet

  return (
    <>
      {showTrigger && canAddProtection && (
        <button
          type="button"
          onClick={addMevProtectionHandler}
          className={cn(
            'flex cursor-pointer select-none items-center gap-1 rounded-3xl bg-subText-20 px-1.5 py-1 text-xs font-medium hover:bg-subText/25',
            className,
          )}
        >
          <Shield size={14} className="text-subText" />
          <span className="inline-flex items-center gap-1 whitespace-nowrap leading-[normal] text-subText">
            {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
            <InfoHelper
              size={14}
              margin={false}
              text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>}
            />
          </span>
        </button>
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </>
  )
}

export default MEVProtection
