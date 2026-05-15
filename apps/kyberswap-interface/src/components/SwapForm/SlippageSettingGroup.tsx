import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/AddMEVProtectionModal'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

export const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`

export default function SlippageSettingGroup({ isWrapOrUnwrap }: { isWrapOrUnwrap: boolean }) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const theme = useTheme()
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
        <Shield size={14} color={theme.subText} />
        <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
          <InfoHelper size={14} text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>} />
        </Text>
      </PriceAlertButton>
    ) : null

  return (
    <Flex alignItems="flex-start" fontSize={12} color={theme.subText} justifyContent="space-between">
      {isWrapOrUnwrap || !isSlippageControlPinned ? (
        <>
          <div />
          {rightButton}
        </>
      ) : (
        <SlippageSetting rightComponent={rightButton} />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </Flex>
  )
}
