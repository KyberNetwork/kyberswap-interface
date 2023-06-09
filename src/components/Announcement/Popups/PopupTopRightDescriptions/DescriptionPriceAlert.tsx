import { ChainId } from '@kyberswap/ks-sdk-core'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Flex, Text } from 'rebass'
import { CSSProperties } from 'styled-components'

import { SimplePopupProps } from 'components/Announcement/Popups/SimplePopup'
import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import { AnnouncementTemplatePriceAlert, NotificationType, PrivateAnnouncementType } from 'components/Announcement/type'
import { Clock } from 'components/Icons'
import Logo, { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { Tab } from 'pages/NotificationCenter/PriceAlerts'
import { NOTIFICATION_ROUTES, PriceAlertType } from 'pages/NotificationCenter/const'

const DescriptionPriceAlert = (
  content: AnnouncementTemplatePriceAlert,
  templateType: PrivateAnnouncementType,
): SimplePopupProps => {
  const {
    chainId: rawChainId,
    tokenInAmount,
    tokenInSymbol,
    tokenInLogoURL,
    tokenOutSymbol,
    tokenOutLogoURL,
    threshold,
    type,
  } = content.alert
  const chainId = Number(rawChainId) as ChainId
  const logoStyle: CSSProperties = { width: 14, height: 14, borderRadius: '50%' }
  const theme = useTheme()
  const isAbove = type === PriceAlertType.ABOVE

  return {
    title: PRIVATE_ANN_TITLE[templateType] ?? '',
    type: NotificationType.SUCCESS,
    link: `${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PRICE_ALERTS}?tab=${Tab.HISTORY}`,
    icon: <Clock size={20} />,
    summary: (
      <Row gap="6px" flexWrap={'wrap'} alignItems="center">
        <Logo srcs={[tokenInLogoURL]} style={logoStyle} />
        {tokenInAmount} {tokenInSymbol} <Text color={theme.subText}>to</Text>
        <Logo srcs={[tokenOutLogoURL]} style={logoStyle} /> {tokenOutSymbol} <Text color={theme.subText}>goes</Text>{' '}
        <Flex alignItems={'center'} style={{ gap: '4px' }} color={isAbove ? theme.primary : theme.red}>
          {isAbove ? <ArrowUp size={16} /> : <ArrowDown size={16} />} {type}
        </Flex>
        {threshold} {tokenOutSymbol} <Text color={theme.subText}>on</Text>{' '}
        <NetworkLogo chainId={chainId} style={logoStyle} /> {NETWORKS_INFO[chainId].name}
      </Row>
    ),
  }
}
export default DescriptionPriceAlert
