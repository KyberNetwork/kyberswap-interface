import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateKyberAI } from 'components/Announcement/type'
import Column from 'components/Column'
import { TokenLogoWithShadow } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { getColorByKyberScore, getTypeByScore } from 'pages/TrueSightV2/utils'
import { capitalizeFirstLetter } from 'utils/string'

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`
export const TokenInfo = ({
  templateBody,
  showPrice = true,
  logoSize = '12px',
}: {
  templateBody: AnnouncementTemplateKyberAI
  showPrice?: boolean
  logoSize?: string
}) => {
  const theme = useTheme()
  const { bullishTokenLogoURL, bullishTokenScore, bullishTokenSymbol } = templateBody || {}
  return (
    <ItemWrapper>
      <TokenLogoWithShadow srcs={[bullishTokenLogoURL]} size={logoSize} />
      <Column gap="4px" fontSize={logoSize}>
        <Text color={theme.text}>
          {bullishTokenSymbol}{' '}
          <Text as="span" color={getColorByKyberScore(+bullishTokenScore, theme)}>
            {bullishTokenScore} ({capitalizeFirstLetter(getTypeByScore(+bullishTokenScore))})
          </Text>
        </Text>
        {showPrice && (
          <Text>
            <Text as="span" color={theme.text}>
              $0.1
            </Text>{' '}
            <Text as="span" color={Math.random() > 0.5 ? theme.apr : theme.red}>
              (+35%)
            </Text>
          </Text>
        )}
      </Column>
    </ItemWrapper>
  )
}

function InboxItemBridge({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateKyberAI>) {
  const { templateBody, isRead, templateType } = announcement

  const navigate = useNavigate()
  const onClick = () => {
    navigate(APP_PATHS.KYBERAI_RANKINGS)
    onRead(announcement, 'kyberAI_watchlist')
  }

  return (
    <InboxItemWrapper isRead={isRead} onClick={onClick} style={{ ...style, paddingTop: '8px', gap: '6px' }}>
      <InboxItemRow>
        <RowItem>
          <InboxIcon type={templateType} />
          <Title isRead={isRead}>{title}</Title>
          {!isRead && <Dot />}
        </RowItem>
      </InboxItemRow>

      <InboxItemRow>
        <TokenInfo templateBody={templateBody} />
        <TokenInfo templateBody={templateBody} />
      </InboxItemRow>

      <InboxItemRow style={{ alignItems: 'center' }}>
        <TokenInfo templateBody={templateBody} />
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemBridge
