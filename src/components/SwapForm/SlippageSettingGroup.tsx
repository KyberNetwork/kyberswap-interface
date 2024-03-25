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
import { useActiveWeb3React } from 'hooks'
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
  isWrapOrUnwrap,
  onOpenGasToken,
}: {
  isStablePairSwap: boolean
  isWrapOrUnwrap: boolean
  onOpenGasToken?: () => void
}) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const theme = useTheme()
  const { chainId, wallet } = useActiveWeb3React()
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
    chainId === ChainId.MAINNET && wallet.isConnected && !isPartnerSwap ? (
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
        <MouseoverTooltip text="Pay network fees in the token of your choice." placement="top">
          <TextDashed>
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
        <SlippageSetting isStablePairSwap={isStablePairSwap} rightComponent={rightButton} />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />
    </Flex>
  )
}
