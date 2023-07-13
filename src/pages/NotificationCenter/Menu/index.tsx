import { t } from '@lingui/macro'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { AlignJustify, List as ListIcon } from 'react-feather'
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
import Withdraw from 'components/Icons/Withdraw'
import Drawer from 'components/Modal/Drawer'
import { getAnnouncementsTemplateIds } from 'constants/env'
import useTheme from 'hooks/useTheme'
import MenuItem from 'pages/NotificationCenter/Menu/MenuItem'
import ImportAccountModal from 'pages/NotificationCenter/Profile/ImportAccountModal'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useProfileInfo, useSignedAccountInfo } from 'state/profile/hooks'
import { MEDIA_WIDTHS } from 'theme'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

export const MENU_TITLE: Partial<{ [type in PrivateAnnouncementType]: string }> = {
  [PrivateAnnouncementType.BRIDGE_ASSET]: t`Cross-Chain Bridge`,
  [PrivateAnnouncementType.CROSS_CHAIN]: t`Cross-Chain Swaps`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Orders`,
  [PrivateAnnouncementType.KYBER_AI]: t`Top Tokens by KyberAI`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alerts`,
  [PrivateAnnouncementType.ELASTIC_POOLS]: t`Elastic Liquidity Positions`,
}

export type Unread = Partial<{ [type in PrivateAnnouncementType]: number | undefined }> & { ALL: number | undefined }

export type MenuItemType = {
  route: string
  type?: string
  icon?: ReactNode
  title?: ReactNode
  divider?: boolean
  childs?: MenuItemType[]
  onClick?: () => void
  defaultExpand?: boolean
}

const menuItems: MenuItemType[] = [
  {
    route: PROFILE_MANAGE_ROUTES.PROFILE,
    icon: <ProfileIcon />,
    title: t`Profile`,
    childs: [],
  },
  {
    route: PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION,
    icon: <NotificationIcon size="16px" />,
    title: t`Notifications`,
    type: 'ALL',
    defaultExpand: true,
    childs: [
      {
        route: PROFILE_MANAGE_ROUTES.PREFERENCE,
        icon: <ListIcon size="16px" />,
        title: t`Notification Preferences`,
        divider: true,
      },
      {
        route: PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION,
        icon: <AllIcon style={{ width: 16 }} />,
        title: t`All Notifications`,
        type: 'ALL',
      },
      {
        route: PROFILE_MANAGE_ROUTES.GENERAL,
        icon: <MailIcon size={16} />,
        title: t`General`,
      },
      {
        route: PROFILE_MANAGE_ROUTES.PRICE_ALERTS,
        type: PrivateAnnouncementType.PRICE_ALERT,
      },
      {
        route: PROFILE_MANAGE_ROUTES.MY_ELASTIC_POOLS,
        type: PrivateAnnouncementType.ELASTIC_POOLS,
      },
      {
        route: PROFILE_MANAGE_ROUTES.LIMIT_ORDERS,
        type: PrivateAnnouncementType.LIMIT_ORDER,
      },
      {
        route: PROFILE_MANAGE_ROUTES.BRIDGE,
        type: PrivateAnnouncementType.BRIDGE_ASSET,
      },
      {
        route: PROFILE_MANAGE_ROUTES.CROSS_CHAIN,
        type: PrivateAnnouncementType.CROSS_CHAIN,
      },
      {
        route: PROFILE_MANAGE_ROUTES.KYBER_AI_TOKENS,
        type: PrivateAnnouncementType.KYBER_AI,
      },
    ],
  },
].map(el => {
  return {
    ...el,
    childs:
      el.route !== PROFILE_MANAGE_ROUTES.ALL_NOTIFICATION
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

type PropsMenu = { unread: Unread; onChildrenClick?: () => void; toggleImportProfile: () => void }

const MenuForDesktop = ({ unread, onChildrenClick, toggleImportProfile }: PropsMenu) => {
  const { isSigInGuest, signedAccount, isSignInGuestDefault } = useSignedAccountInfo()
  const { profile } = useProfileInfo()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const menuItemDeskTop = useMemo(() => {
    return menuItems.map(el => {
      if (el.route !== PROFILE_MANAGE_ROUTES.PROFILE) return el
      const guestText = isSignInGuestDefault ? t`Guest` : t`Imported Guest`
      const childs: MenuItemType[] = [
        isSigInGuest
          ? {
              route: PROFILE_MANAGE_ROUTES.PROFILE,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? `${shortString(profile?.nickname, 20)}` : guestText,
            }
          : {
              route: PROFILE_MANAGE_ROUTES.PROFILE,
              icon: <Avatar url={profile?.avatarUrl} size={16} />,
              title: profile?.nickname ? shortString(profile?.nickname, 20) : getShortenAddress(signedAccount ?? ''),
            },
      ]
      childs.push({
        onClick: toggleImportProfile,
        route: '#',
        icon: <Withdraw width={16} height={16} />,
        title: t`Import`,
      })
      return { ...el, childs }
    })
  }, [signedAccount, isSigInGuest, profile, toggleImportProfile, isSignInGuestDefault])

  return (
    <Flex sx={{ flexDirection: 'column', padding: upToMedium ? '0px' : '24px' }}>
      {menuItemDeskTop.map((data, index) => (
        <MenuItem
          key={index}
          index={index}
          style={{ paddingTop: index ? undefined : 0 }}
          data={data}
          unread={unread}
          onChildrenClick={onChildrenClick}
        />
      ))}
    </Flex>
  )
}

const MenuForMobile = (props: PropsMenu) => {
  const isOpen = useModalOpen(ApplicationModal.MENU_NOTI_CENTER)
  const toggleModal = useToggleModal(ApplicationModal.MENU_NOTI_CENTER)
  const theme = useTheme()

  return (
    <Drawer
      title={t`Your Profile`}
      trigger={<AlignJustify color={theme.subText} onClick={toggleModal} />}
      isOpen={isOpen}
      onDismiss={toggleModal}
    >
      <MenuForDesktop {...props} onChildrenClick={toggleModal} />
    </Drawer>
  )
}

const Menu = () => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const [showModalImport, setShowModalImport] = useState(false)

  const templateIds = Object.values(PrivateAnnouncementType)
    .filter(e => e !== PrivateAnnouncementType.DIRECT_MESSAGE)
    .map(getAnnouncementsTemplateIds)
    .filter(Boolean)
    .join(',')

  const { userInfo } = useSessionInfo()
  const { data = [] } = useGetTotalUnreadAnnouncementsQuery({ templateIds }, { skip: !userInfo?.identityId })

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

  const toggleImportProfile = useCallback(() => setShowModalImport(v => !v), [])

  const props = { unread, toggleImportProfile }

  return (
    <>
      {upToMedium ? <MenuForMobile {...props} /> : <MenuForDesktop {...props} />}
      <ImportAccountModal isOpen={showModalImport} onDismiss={() => setShowModalImport(false)} />
    </>
  )
}

export default Menu
