import { t } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'
import { AlignJustify, List as ListIcon, Plus } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { useGetTotalUnreadAnnouncementsQuery } from 'services/announcement'
import { css } from 'styled-components'

import { ReactComponent as AllIcon } from 'assets/svg/all_icon.svg'
import InboxIcon from 'components/Announcement/PrivateAnnoucement/Icon'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import Avatar from 'components/Avatar'
import MailIcon from 'components/Icons/MailIcon'
import NotificationIcon from 'components/Icons/NotificationIcon'
import ProfileIcon from 'components/Icons/Profile'
import MenuFlyout from 'components/MenuFlyout'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import useTheme from 'hooks/useTheme'
import MenuItem from 'pages/NotificationCenter/Menu/MenuItem'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useSessionInfo, useSignedWalletInfo } from 'state/authen/hooks'
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
  const { signInEth } = useLogin()
  const { userInfo: profile } = useSessionInfo()
  const { signedWallet, isGuest, canSignInEth } = useSignedWalletInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const menuItemDeskTop = useMemo(() => {
    return menuItems.map(el => {
      if (el.route !== NOTIFICATION_ROUTES.PROFILE) return el
      const childs: MenuItemType[] = [
        isGuest
          ? {
              route: NOTIFICATION_ROUTES.PROFILE,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? `${shortString(profile?.nickname, 20)} (${t`Guest`})` : t`Guest`,
            }
          : {
              route: NOTIFICATION_ROUTES.PROFILE,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? shortString(profile?.nickname, 20) : getShortenAddress(signedWallet ?? ''),
            },
      ]
      if (canSignInEth)
        childs.push({
          route: '',
          icon: <Plus size="16px" />,
          title: t`Add Account`,
          onClick: () => signInEth(),
        })
      return { ...el, childs }
    })
  }, [canSignInEth, signInEth, signedWallet, isGuest, profile])

  return (
    <Flex sx={{ flexDirection: 'column', padding: upToMedium ? '20px' : '24px' }}>
      {menuItemDeskTop.map((data, index) => (
        <MenuItem key={index} style={{ paddingTop: index ? undefined : 0 }} data={data} unread={unread} />
      ))}
    </Flex>
  )
}

const browserCustomStyle = css`
  padding: 0;
`
const MenuForMobile = ({ unread }: PropsMenu) => {
  const isOpen = useModalOpen(ApplicationModal.MENU_NOTI_CENTER)
  const toggleModal = useToggleModal(ApplicationModal.MENU_NOTI_CENTER)
  const theme = useTheme()
  return (
    <MenuFlyout
      trigger={<AlignJustify color={theme.subText} />}
      customStyle={browserCustomStyle}
      isOpen={isOpen}
      toggle={toggleModal}
    >
      <MenuForDesktop unread={unread} />
    </MenuFlyout>
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
