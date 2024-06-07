import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Shield } from 'components/Icons'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { usePaymentToken, useSlippageSettingByPage } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

import AddMEVProtectionModal from './AddMEVProtectionModal'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`

export default function SlippageSettingGroup({
  isStablePairSwap,
  isCorrelatedPair,
  isWrapOrUnwrap,
  onOpenGasToken,
}: {
  isStablePairSwap: boolean
  isCorrelatedPair: boolean
  isWrapOrUnwrap: boolean
  onOpenGasToken?: () => void
}) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { active } = useWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const { mixpanelHandler } = useMixpanel()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    mixpanelHandler(MIXPANEL_TYPE.MEV_CLICK_ADD_MEV)
  }, [mixpanelHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const [paymentToken] = usePaymentToken()
  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  let rightButton =
    chainId === ChainId.MAINNET && active && !isPartnerSwap ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} color={theme.subText} />
        <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
        </Text>
      </PriceAlertButton>
    ) : null

  if (chainId === ChainId.ZKSYNC && !isPartnerSwap) {
    rightButton = (
      <Flex alignItems="center" width="fit-content" role="button" sx={{ cursor: 'pointer' }} onClick={onOpenGasToken}>
        <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EvStationRoundedIcon" width="16px">
          <path
            d="m19.77 7.23.01-.01-3.19-3.19c-.29-.29-.77-.29-1.06 0-.29.29-.29.77 0 1.06l1.58 1.58c-1.05.4-1.76 1.47-1.58 2.71.16 1.1 1.1 1.99 2.2 2.11.47.05.88-.03 1.27-.2v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v15c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-6.5h1.5v4.86c0 1.31.94 2.5 2.24 2.63 1.5.15 2.76-1.02 2.76-2.49V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 16.12V13.5H6.83c-.38 0-.62-.4-.44-.74l2.67-5c.24-.45.94-.28.94.24v3h1.14c.38 0 .62.41.43.75l-2.64 4.62c-.25.44-.93.26-.93-.25z"
            fill="#A8ABFF"
          />
        </svg>

        <MouseoverTooltip text="Pay network fees in the token of your choice." placement="top">
          <TextDashed marginLeft="6px" lineHeight="16px" fontWeight="500" marginTop="2px">
            <Trans>Gas Token</Trans>
          </TextDashed>
        </MouseoverTooltip>
        <Text fontWeight="500" marginLeft="6px" color={theme.text}>
          {paymentToken ? paymentToken.symbol : 'ETH'}
        </Text>
        <DropdownSVG />
      </Flex>
    )
  }

  return (
    <Flex alignItems="flex-start" fontSize={12} color={theme.subText} justifyContent="space-between">
      {isWrapOrUnwrap || !isSlippageControlPinned ? (
        <>
          <div />
          {rightButton}
        </>
      ) : (
        <SlippageSetting
          isStablePairSwap={isStablePairSwap}
          rightComponent={rightButton}
          isCorrelatedPair={isCorrelatedPair}
        />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </Flex>
  )
}
