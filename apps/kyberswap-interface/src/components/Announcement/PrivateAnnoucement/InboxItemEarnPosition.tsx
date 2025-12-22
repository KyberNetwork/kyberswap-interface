import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router'
import { Flex } from 'rebass'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import InboxActions from 'components/Announcement/PrivateAnnoucement/InboxActions'
import {
  Dot,
  InboxItemRow,
  InboxItemWrapper,
  PrimaryText,
  RowItem,
  StatusBadge,
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePoolPosition } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

function InboxItemEarnPosition({
  announcement,
  onRead,
  style,
  time,
  title,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplatePoolPosition>) {
  const { templateBody, isRead, templateType } = announcement
  const theme = useTheme()

  const {
    positionId,
    currentPrice,
    maxPrice,
    minPrice,
    token0LogoURL,
    token0Symbol,
    token1LogoURL,
    token1Symbol,
    chainId: rawChain,
    exchange,
  } = templateBody?.position || {}

  const chainId = Number(rawChain) as ChainId
  const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice
  const statusMessage = isInRange ? t`Back in range` : t`Out of range`

  const navigate = useNavigate()
  const onClick = () => {
    const positionUrl = APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', positionId)
      .replace(':chainId', rawChain)
      .replace(':exchange', exchange)
    navigate(positionUrl)
    onRead(announcement, statusMessage)
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxActions
        isPinned={announcement.isPinned}
        onPin={onPin ? () => onPin(announcement) : undefined}
        onDelete={onDelete ? () => onDelete(announcement) : undefined}
      />
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} chainId={chainId} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <StatusBadge color={isInRange ? theme.primary : theme.warning}>{statusMessage}</StatusBadge>
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <DoubleCurrencyLogoV2
            style={{ marginRight: 10 }}
            logoUrl1={token0LogoURL}
            logoUrl2={token1LogoURL}
            size={16}
          />
          <PrimaryText style={{ fontSize: 14 }}>
            {token0Symbol}/{token1Symbol}
          </PrimaryText>
        </Flex>
        <PrimaryText>
          {currentPrice} {token0Symbol}/{token1Symbol}
        </PrimaryText>
      </InboxItemRow>

      <InboxItemRow>
        <PrimaryText color={theme.subText}>
          {minPrice} - {maxPrice} {token0Symbol}/{token1Symbol}
        </PrimaryText>
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}

export default InboxItemEarnPosition
