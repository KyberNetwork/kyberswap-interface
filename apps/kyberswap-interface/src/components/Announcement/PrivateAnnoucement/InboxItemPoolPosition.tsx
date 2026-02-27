import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
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
  Title,
} from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplatePoolPosition } from 'components/Announcement/type'
import { DoubleCurrencyLogoV2 } from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { useNavigateToUrl } from 'utils/redirect'

/** @deprecated */
function InboxItemPoolPosition({
  announcement,
  onRead,
  style,
  time,
  title,
  onPin,
  onDelete,
}: PrivateAnnouncementProp<AnnouncementTemplatePoolPosition>) {
  const theme = useTheme()
  const navigate = useNavigateToUrl()

  const { templateBody, isRead, templateType } = announcement
  const {
    chainId: rawChain,
    token0Symbol,
    token1Symbol,
    token0LogoURL,
    token1LogoURL,
    currentPrice,
    minPrice,
    maxPrice,
    poolAddress,
  } = templateBody?.position || {}

  const chainId = Number(rawChain) as ChainId
  const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice
  const statusMessage = isInRange ? t`Back in range` : t`Out of range`

  const onClick = () => {
    navigate(`${APP_PATHS.MY_POOLS}/${NETWORKS_INFO[chainId].route}?search=${poolAddress}`, chainId)
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
          <Title>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <PrimaryText>{statusMessage}</PrimaryText>
          <MoneyBag color={isInRange ? theme.apr : theme.warning} size={16} />
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <Flex alignItems={'center'} style={{ gap: '4px' }}>
          <DoubleCurrencyLogoV2
            style={{ marginRight: 10 }}
            logoUrl1={token0LogoURL}
            logoUrl2={token1LogoURL}
            size={12}
          />
          <PrimaryText>
            {token0Symbol}/{token1Symbol}
          </PrimaryText>
        </Flex>
        <PrimaryText color={isInRange ? theme.primary : theme.warning}>
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
export default InboxItemPoolPosition
