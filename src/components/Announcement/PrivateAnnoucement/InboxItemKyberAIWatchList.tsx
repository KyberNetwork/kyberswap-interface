import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { PrivateAnnouncementProp } from 'components/Announcement/PrivateAnnoucement'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { Dot, InboxItemRow, InboxItemWrapper, RowItem, Title } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplateKyberAIWatchlist, TokenInfoWatchlist } from 'components/Announcement/type'
import Column from 'components/Column'
import { TokenLogoWithShadow } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { KyberAIListType } from 'pages/TrueSightV2/types'
import { calculateValueToColor, getTypeByKyberScore } from 'pages/TrueSightV2/utils'
import { formatDisplayNumber } from 'utils/numbers'

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`
export const TokenInfo = ({
  showPrice = false,
  logoSize = '12px',
  token,
}: {
  showPrice?: boolean
  logoSize?: string
  token: TokenInfoWatchlist
}) => {
  const theme = useTheme()
  const { logoURL, symbol, price, priceChange, kyberScore } = token || {}
  return (
    <ItemWrapper>
      <TokenLogoWithShadow srcs={[logoURL]} size={logoSize} />
      <Column gap="4px" fontSize={logoSize}>
        <Text color={theme.text}>
          {symbol}{' '}
          <Text as="span" color={calculateValueToColor(+kyberScore, theme)}>
            {kyberScore} ({getTypeByKyberScore(+kyberScore)})
          </Text>
        </Text>
        {showPrice && (
          <Text>
            <Text as="span" color={theme.text}>
              {formatDisplayNumber(price, { style: 'currency', significantDigits: 4 })}
            </Text>{' '}
            <Text as="span" color={+priceChange > 0 ? theme.apr : theme.red}>
              ({+priceChange > 0 && '+'}
              {formatDisplayNumber(+priceChange / 100, { style: 'percent', fractionDigits: 2, allowNegative: true })})
            </Text>
          </Text>
        )}
      </Column>
    </ItemWrapper>
  )
}

export const useNavigateToMyWatchList = () => {
  const navigate = useNavigate()
  return () => navigate(`${APP_PATHS.KYBERAI_RANKINGS}?listType=${KyberAIListType.MYWATCHLIST}`)
}

function InboxItemKyberAIWatchlist({
  announcement,
  onRead,
  style,
  time,
  title,
}: PrivateAnnouncementProp<AnnouncementTemplateKyberAIWatchlist>) {
  const { templateBody, isRead, templateType } = announcement
  const { assets = [] } = templateBody || {}
  const [token1, token2, token3] = assets

  const navigateToWatchList = useNavigateToMyWatchList()
  const onClick = () => {
    navigateToWatchList()
    onRead(announcement, 'kyberAI_watchlist')
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
        {token1 && <TokenInfo token={token1} />}
        {token2 && <TokenInfo token={token2} />}
      </InboxItemRow>

      <InboxItemRow style={{ alignItems: 'center' }}>
        {token3 ? <TokenInfo token={token3} /> : <div />}
        {time}
      </InboxItemRow>
    </InboxItemWrapper>
  )
}
export default InboxItemKyberAIWatchlist
