import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { List as ListIcon } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { useGetTotalUnreadAnnouncementsQuery } from 'services/announcement'
import styled from 'styled-components'

import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import MailIcon from 'components/Icons/MailIcon'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import MenuItem from 'pages/NotificationCenter/Menu/MenuItem'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { MEDIA_WIDTHS } from 'theme'

const Divider = styled.div<{ $margin?: string }>`
  height: 0;
  width: 100%;
  padding: 0 24px;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: ${({ $margin }) => $margin || '0'};
`

type Unread = Partial<{ [type in PrivateAnnouncementType]: number | undefined }> & { ALL: number | undefined }
const menuItems = [
  {
    route: NOTIFICATION_ROUTES.OVERVIEW,
    icon: <NotificationIcon size="16px" />,
    title: t`Notification Overview`,
    type: '',
    parent: true,
  },
  {
    route: NOTIFICATION_ROUTES.ALL,
    icon: <ListIcon size="16px" />,
    title: t`All Notifications`,
    type: 'ALL',
    parent: true,
  },
  {
    route: NOTIFICATION_ROUTES.GENERAL,
    icon: <MailIcon size={16} />,
    title: t`General`,
    type: '',
  },
  {
    route: NOTIFICATION_ROUTES.PRICE_ALERTS,
    type: PrivateAnnouncementType.PRICE_ALERT,
  },
  {
    route: NOTIFICATION_ROUTES.MY_ELASTIC_POOLS,
    type: PrivateAnnouncementType.ELASTIC_POOLS,
  },
  {
    route: NOTIFICATION_ROUTES.LIMIT_ORDERS,
    type: PrivateAnnouncementType.LIMIT_ORDER,
  },
  {
    route: NOTIFICATION_ROUTES.BRIDGE,
    type: PrivateAnnouncementType.BRIDGE_ASSET,
  },
  {
    route: NOTIFICATION_ROUTES.CROSS_CHAIN,
    type: PrivateAnnouncementType.CROSS_CHAIN,
  },
  {
    route: NOTIFICATION_ROUTES.KYBER_AI_TOKENS,
    type: PrivateAnnouncementType.KYBER_AI,
  },
]
const MenuForDesktop = ({ unread }: { unread: Unread }) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        padding: '24px',
      }}
    >
      {menuItems.map(({ type, route, icon, title, parent }, index) => {
        const paddingVertical = parent ? '14px' : '8px'
        const paddingLeft = parent ? 0 : '24px'
        const formatType = type as PrivateAnnouncementType
        return (
          <>
            <MenuItem
              style={{
                paddingLeft,
                paddingTop: index && route !== NOTIFICATION_ROUTES.GENERAL ? paddingVertical : 0,
                paddingBottom: paddingVertical,
              }}
              key={route}
              href={route}
              icon={icon || <InboxIcon type={formatType} />}
              text={title || MENU_TITLE[formatType]}
              unread={unread[formatType]}
            />
            {[NOTIFICATION_ROUTES.OVERVIEW, NOTIFICATION_ROUTES.GENERAL].includes(route) && (
              <Divider style={{ marginLeft: paddingLeft, width: `calc(100% - ${paddingLeft})` }} />
            )}
          </>
        )
      })}
    </Flex>
  )
}

export const MENU_TITLE: Partial<{ [type in PrivateAnnouncementType]: string }> = {
  [PrivateAnnouncementType.BRIDGE_ASSET]: t`Bridge Token`,
  [PrivateAnnouncementType.CROSS_CHAIN]: t`Cross-Chain Swap`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Orders`,
  [PrivateAnnouncementType.KYBER_AI]: t`Top Tokens by KyberAI`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alerts`,
  [PrivateAnnouncementType.ELASTIC_POOLS]: t`Elastic Liquidity Positions`,
}

const MenuForMobile = ({ unread }: { unread: Unread }) => {
  return (
    <Flex
      sx={{
        overflowX: 'auto',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
      }}
    >
      {menuItems.map(({ type, route, icon, title }) => {
        const formatType = type as PrivateAnnouncementType
        return (
          <MenuItem
            isMobile
            key={route}
            href={route}
            icon={icon || <InboxIcon type={formatType} />}
            text={title || MENU_TITLE[formatType]}
            unread={unread[formatType]}
          />
        )
      })}
    </Flex>
  )
}

const Menu = () => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { account } = useActiveWeb3React()

  const templateIds = Object.values(PrivateAnnouncementType)
    .filter(e => e !== PrivateAnnouncementType.DIRECT_MESSAGE)
    .map(getAnnouncementsTemplateIds)
    .filter(Boolean)
    .join(',')

  const { data = [] } = useGetTotalUnreadAnnouncementsQuery({ account: account ?? '', templateIds }, { skip: !account })

  const unread = useMemo(() => {
    const result = {} as Unread
    let all = 0
    data.forEach(({ templateType, numberOfUnread }) => {
      result[templateType] = (result[templateType] || 0) + numberOfUnread
      all += numberOfUnread
    })
    result.ALL = all
    return result
  }, [data])

  if (upToMedium) {
    return <MenuForMobile unread={unread} />
  }

  return <MenuForDesktop unread={unread} />
}

export default Menu
