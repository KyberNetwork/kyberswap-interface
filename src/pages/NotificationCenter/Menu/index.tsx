import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { List as ListIcon, Plus } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { useGetTotalUnreadAnnouncementsQuery } from 'services/announcement'

import { ReactComponent as AllIcon } from 'assets/svg/all_icon.svg'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import Avatar from 'components/Avatar'
import MailIcon from 'components/Icons/MailIcon'
import NotificationIcon from 'components/Icons/NotificationIcon'
import ProfileIcon from 'components/Icons/Profile'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import MenuItem from 'pages/NotificationCenter/Menu/MenuItem'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { useAllProfileInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

export const MENU_TITLE: Partial<{ [type in PrivateAnnouncementType]: string }> = {
  [PrivateAnnouncementType.BRIDGE_ASSET]: t`Cross-Chain Bridge`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Orders`,
  [PrivateAnnouncementType.KYBER_AI]: t`Trending Soon Tokens`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alerts`,
  [PrivateAnnouncementType.ELASTIC_POOLS]: t`Elastic Liquidity Positions`,
}

export type Unread = Partial<{ [type in PrivateAnnouncementType]: number | undefined }> & { ALL: number | undefined }

export type MenuItemType = {
  route: string
  type?: string
  icon?: ReactNode
  title?: string
  divider?: boolean
  childs?: MenuItemType[]
  onClick?: () => void
}

const menuItems: MenuItemType[] = [
  {
    route: NOTIFICATION_ROUTES.PROFILE,
    icon: <ProfileIcon />,
    title: t`Profile`,
    childs: [],
  },
  {
    route: NOTIFICATION_ROUTES.ALL_NOTIFICATION,
    icon: <NotificationIcon size="16px" />,
    title: t`Notifications`,
    type: 'ALL',
    childs: [
      {
        route: NOTIFICATION_ROUTES.PREFERENCE,
        icon: <ListIcon size="16px" />,
        title: t`Notification Preferences`,
        divider: true,
      },
      {
        route: NOTIFICATION_ROUTES.ALL_NOTIFICATION,
        icon: <AllIcon style={{ width: 16 }} />,
        title: t`All Notifications`,
        type: 'ALL',
      },
      {
        route: NOTIFICATION_ROUTES.GENERAL,
        icon: <MailIcon size={16} />,
        title: t`General`,
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
        route: NOTIFICATION_ROUTES.KYBER_AI_TOKENS,
        type: PrivateAnnouncementType.KYBER_AI,
      },
    ],
  },
].map(el => {
  return {
    ...el,
    childs:
      el.route !== NOTIFICATION_ROUTES.ALL_NOTIFICATION
        ? el.childs
        : el.childs?.map((child: MenuItemType) => {
            const type = child.type as PrivateAnnouncementType
            return {
              ...child,
              title: child.title || MENU_TITLE[type],
              icon: child.icon || <InboxIcon type={type} />,
            }
          }),
  }
})

type PropsMenu = { unread: Unread }
const MenuForDesktop = ({ unread }: PropsMenu) => {
  // todo mobile
  const { account } = useActiveWeb3React()
  const { signInEth } = useLogin()
  const { profiles } = useAllProfileInfo()

  const menuItemDeskTop = useMemo(() => {
    return menuItems.map(el => {
      if (el.route !== NOTIFICATION_ROUTES.PROFILE) return el
      const childs: MenuItemType[] = profiles.map(({ guest, profile, address }) =>
        guest
          ? {
              route: NOTIFICATION_ROUTES.GUEST_PROFILE,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? `${shortString(profile?.nickname, 20)} (${address})` : address,
            }
          : {
              route: `${NOTIFICATION_ROUTES.PROFILE}/${address}`,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? shortString(profile?.nickname, 20) : getShortenAddress(address),
            },
      )
      if (account)
        childs.push({
          route: '',
          icon: <Plus size="16px" />,
          title: t`Add Account`,
          onClick: () => signInEth(),
        })
      return { ...el, childs }
    })
  }, [account, signInEth, profiles])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        padding: '24px',
      }}
    >
      {menuItemDeskTop.map((data, index) => {
        return <MenuItem key={index} style={{ paddingTop: index ? undefined : 0 }} data={data} unread={unread} />
      })}
    </Flex>
  )
}

const menuItemsMobile = menuItems.reduce<MenuItemType[]>((rs, item) => {
  rs.push(item)
  item.childs?.forEach(e => rs.push(e))
  return rs
}, [])

const MenuForMobile = ({ unread }: PropsMenu) => {
  return (
    <Flex
      sx={{
        overflowX: 'auto',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
      }}
    >
      {menuItemsMobile.map(data => {
        return <MenuItem isMobile key={data.route} data={data} unread={unread} />
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

  const { data = [] } = useGetTotalUnreadAnnouncementsQuery({ templateIds }, { skip: !account })

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

  const props = { unread }
  return upToMedium ? <MenuForMobile {...props} /> : <MenuForDesktop {...props} />
}

export default Menu
