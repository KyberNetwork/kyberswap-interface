import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { List as ListIcon } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { useGetTotalUnreadAnnouncementsQuery } from 'services/announcement'
import styled from 'styled-components'

import { ReactComponent as AlarmIcon } from 'assets/svg/alarm.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as DropIcon } from 'assets/svg/drop.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import ApeIcon from 'components/Icons/ApeIcon'
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

const MenuForDesktop = ({ unread }: { unread: Unread }) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        padding: '24px',
        gap: '16px',
      }}
    >
      <MenuItem
        href={NOTIFICATION_ROUTES.OVERVIEW}
        icon={<NotificationIcon size="16px" />}
        text={t`Notification Overview`}
      />
      <Divider $margin="4px 0" />
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <MenuItem
          href={NOTIFICATION_ROUTES.ALL}
          icon={<ListIcon size="16px" />}
          text={t`All Notifications`}
          unread={unread.ALL}
        />
        <Flex
          sx={{
            flexDirection: 'column',
            paddingLeft: '24px',
            gap: '16px',
          }}
        >
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <MenuItem href={NOTIFICATION_ROUTES.GENERAL} icon={<MailIcon size={16} />} text={t`General`} />
            <Divider />
            <MenuItem
              href={NOTIFICATION_ROUTES.PRICE_ALERTS}
              icon={<AlarmIcon width={16} height={16} />}
              text={MENU_TITLE.PRICE_ALERT}
              unread={unread.PRICE_ALERT}
            />
          </Flex>

          <MenuItem
            href={NOTIFICATION_ROUTES.MY_ELASTIC_POOLS}
            icon={<DropIcon width="16px" height="16px" />}
            text={MENU_TITLE.ELASTIC_POOLS}
            unread={unread.ELASTIC_POOLS}
          />
          <MenuItem
            href={NOTIFICATION_ROUTES.LIMIT_ORDERS}
            icon={<LimitOrderIcon />}
            text={MENU_TITLE.LIMIT_ORDER}
            unread={unread.LIMIT_ORDER}
          />
          <MenuItem
            href={NOTIFICATION_ROUTES.BRIDGE}
            icon={<BridgeIcon width="16px" height="16px" />}
            text={MENU_TITLE.BRIDGE_ASSET}
            unread={unread.BRIDGE_ASSET}
          />
          <MenuItem
            href={NOTIFICATION_ROUTES.TRENDING_SOON_TOKENS}
            icon={<ApeIcon size={16} />}
            text={MENU_TITLE.TRENDING_SOON}
            unread={unread.TRENDING_SOON}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export const MENU_TITLE: Partial<{ [type in PrivateAnnouncementType]: string }> = {
  [PrivateAnnouncementType.BRIDGE]: t`Cross-Chain Bridge`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Orders`,
  [PrivateAnnouncementType.TRENDING_SOON_TOKEN]: t`Top Tokens by KyberAI`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alerts`,
  [PrivateAnnouncementType.POOL_POSITION]: t`Elastic Liquidity Positions`,
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
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.OVERVIEW}
        icon={<NotificationIcon size="16px" />}
        text={t`Notification Overview`}
      />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.ALL}
        icon={<ListIcon size="16px" />}
        text={t`All Notifications`}
        unread={unread.ALL}
      />
      <MenuItem isMobile href={NOTIFICATION_ROUTES.GENERAL} icon={<MailIcon size={16} />} text={t`General`} />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.PRICE_ALERTS}
        icon={<AlarmIcon width={16} height={16} />}
        text={MENU_TITLE.PRICE_ALERT}
        unread={unread.PRICE_ALERT}
      />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.MY_ELASTIC_POOLS}
        icon={<DropIcon width="16px" height="16px" />}
        text={MENU_TITLE.ELASTIC_POOLS}
        unread={unread.ELASTIC_POOLS}
      />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.LIMIT_ORDERS}
        icon={<LimitOrderIcon />}
        text={MENU_TITLE.LIMIT_ORDER}
        unread={unread.LIMIT_ORDER}
      />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.BRIDGE}
        icon={<BridgeIcon width="16px" height="16px" />}
        text={MENU_TITLE.BRIDGE_ASSET}
        unread={unread.BRIDGE_ASSET}
      />
      <MenuItem
        isMobile
        href={NOTIFICATION_ROUTES.TRENDING_SOON_TOKENS}
        icon={<ApeIcon size={16} />}
        text={MENU_TITLE.TRENDING_SOON}
        unread={unread.TRENDING_SOON}
      />
    </Flex>
  )
}

const Menu = () => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { account } = useActiveWeb3React()
  const templates = getAnnouncementsTemplateIds()

  const templateIds = Object.values(PrivateAnnouncementType)
    .filter(e => e !== PrivateAnnouncementType.DIRECT_MESSAGE)
    .map(e => templates[e])
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
