import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ArrowDown, ArrowUp, Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { useNavigateCtaPopup } from 'components/Announcement/helper'
import { AnnouncementTemplatePriceAlert, PrivateAnnouncementType } from 'components/Announcement/type'
import { ButtonLight } from 'components/Button'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import useTheme from 'hooks/useTheme'
import { PriceAlertType } from 'pages/NotificationCenter/const'

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
}: PrivateAnnouncementProp<AnnouncementTemplatePriceAlert>) {
  const { templateBody, isRead } = announcement
  const theme = useTheme()

  const {
    tokenInLogoURL,
    tokenOutLogoURL,
    tokenOutSymbol,
    tokenInSymbol,
    type,
    chainId: rawChainId,
    tokenInAmount,
    threshold,
    swapUrl,
  } = templateBody.alert
  const chainId = Number(rawChainId) as ChainId

  const navigate = useNavigateCtaPopup()
  const onClick = () => {
    navigate(swapUrl, chainId)
    onRead(announcement, 'price_alert')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={PrivateAnnouncementType.PRICE_ALERT} chainId={chainId} />
          <Title isRead={isRead}>
            <Trans>Price Alert</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <ButtonLight height={'24px'} style={{ display: 'flex', gap: '6px', padding: '12px 10px' }}>
            <Repeat size={16} /> Swap
          </ButtonLight>
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <DeltaTokenAmount color={theme.text} amount={tokenInAmount} symbol={tokenInSymbol} logoURL={tokenInLogoURL} />
          <Text color={theme.subText}>
            <Trans>to</Trans>
          </Text>
          <DeltaTokenAmount color={theme.text} amount={<div />} symbol={tokenOutSymbol} logoURL={tokenOutLogoURL} />
        </Flex>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <Flex
            style={{ gap: '4px' }}
            alignItems={'center'}
            color={type === PriceAlertType.ABOVE ? theme.primary : theme.red}
          >
            {type === PriceAlertType.ABOVE ? <ArrowUp size={16} /> : <ArrowDown size={16} />} {type}
          </Flex>
          {threshold} {tokenOutSymbol}
        </Flex>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
