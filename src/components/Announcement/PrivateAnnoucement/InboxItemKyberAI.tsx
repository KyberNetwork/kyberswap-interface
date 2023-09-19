import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateTrendingSoon } from 'components/Announcement/type'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Icon from 'components/Icons/Icon'
import DeltaTokenAmount from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const ItemWrapper = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ color }) => color};
`
export const TokenInfo = ({
  templateBody,
  type,
}: {
  templateBody: AnnouncementTemplateTrendingSoon
  type: 'bullish' | 'bearish' | 'trending'
}) => {
  const theme = useTheme()
  const {
    bullishTokenLogoURL,
    bullishTokenScore,
    bullishTokenSymbol,
    bearishTokenLogoURL,
    bearishTokenScore,
    bearishTokenSymbol,
    trendingSoonTokenLogoURL,
    trendingSoonTokenScore,
    trendingSoonTokenSymbol,
  } = templateBody || {}
  switch (type) {
    case 'bullish':
      return (
        <ItemWrapper color={theme.apr}>
          <Icon id="bullish" size={14} /> <Trans>Bullish:</Trans>
          <DeltaTokenAmount
            amount={null}
            logoURL={bullishTokenLogoURL}
            color={theme.text}
            symbol={`${bullishTokenSymbol} (${bullishTokenScore})`}
          />
        </ItemWrapper>
      )
    case 'bearish':
      return (
        <ItemWrapper color={theme.red}>
          <Icon id="bearish" size={12} /> <Trans>Bearish:</Trans>
          <DeltaTokenAmount
            amount={null}
            logoURL={bearishTokenLogoURL}
            color={theme.text}
            symbol={`${bearishTokenSymbol} (${bearishTokenScore})`}
          />
        </ItemWrapper>
      )
    case 'trending':
      return (
        <ItemWrapper color={theme.text}>
          <DiscoverIcon size={12} /> <Trans>Trending Soon:</Trans>
          <DeltaTokenAmount
            amount={null}
            logoURL={trendingSoonTokenLogoURL}
            color={theme.text}
            symbol={`${trendingSoonTokenSymbol} (${trendingSoonTokenScore})`}
          />
        </ItemWrapper>
      )
  }
}

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateTrendingSoon>) {
  const { templateBody, isRead, templateType } = announcement

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.KYBERAI_RANKINGS)
    onRead(announcement, 'trending_soon')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={style}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <TokenInfo templateBody={templateBody} type="bullish" />
        <TokenInfo templateBody={templateBody} type="bearish" />
      </InboxItemRow>

      <InboxItemRow>
        <TokenInfo templateBody={templateBody} type="trending" />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
