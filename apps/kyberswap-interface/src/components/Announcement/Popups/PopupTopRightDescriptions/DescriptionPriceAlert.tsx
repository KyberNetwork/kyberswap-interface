import { ChainId } from '@kyberswap/ks-sdk-core'
import { CSSProperties } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'

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
import { PROFILE_MANAGE_ROUTES, PriceAlertType } from 'pages/NotificationCenter/const'

const DescriptionPriceAlert = (
  content: AnnouncementTemplatePriceAlert,
  templateType: PrivateAnnouncementType,
): SimplePopupProps => {
  const theme = useTheme()
  const {
    chainId: rawChainId,
    tokenInAmount,
    tokenInSymbol,
    tokenInLogoURL,
    tokenOutSymbol,
    tokenOutLogoURL,
    threshold,
    type,
  } = content?.alert || {}
  const chainId = Number(rawChainId) as ChainId
  const logoStyle: CSSProperties = { width: 14, height: 14, borderRadius: '50%' }
  const isAbove = type === PriceAlertType.ABOVE

  return {
    title: PRIVATE_ANN_TITLE()[templateType] ?? '',
    type: NotificationType.SUCCESS,
    link: `${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PRICE_ALERTS}?tab=${Tab.HISTORY}`,
    icon: <Clock size={20} className="text-primary" />,
    summary: (
      <Row gap="6px" flexWrap={'wrap'} alignItems="center">
        <Logo srcs={[tokenInLogoURL]} style={logoStyle} />
        {tokenInAmount} {tokenInSymbol} <span className="text-subText">to</span>
        <Logo srcs={[tokenOutLogoURL]} style={logoStyle} /> {tokenOutSymbol} <span className="text-subText">goes</span>{' '}
        <span className="flex items-center gap-1" style={{ color: isAbove ? theme.primary : theme.red }}>
          {isAbove ? <ArrowUp size={16} /> : <ArrowDown size={16} />} {type}
        </span>
        {threshold} {tokenOutSymbol} <span className="text-subText">on</span>{' '}
        <NetworkLogo chainId={chainId} style={logoStyle} /> {NETWORKS_INFO[chainId].name}
      </Row>
    ),
  }
}
export default DescriptionPriceAlert
