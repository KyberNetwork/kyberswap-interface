import { CSSProperties, Fragment, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { formatNumberOfUnread } from 'components/Announcement/helper'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { MenuItemType, Unread } from 'pages/NotificationCenter/Menu'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { cn } from 'utils/cn'

type Props = {
  isMobile?: boolean
  style?: CSSProperties
  unread: Unread
  data: MenuItemType
  isChildren?: boolean
  onChildrenClick?: () => void
  index?: number
}

const MenuItem: React.FC<Props> = ({ data, style, unread, isChildren, onChildrenClick, index }) => {
  const { icon, title, route, childs, type, onClick, defaultExpand } = data
  const location = useLocation()
  const theme = useTheme()

  const path = `${APP_PATHS.PROFILE_MANAGE}${route}`
  const isActive = location.pathname === path || location.pathname === path.substring(0, path.length - 1)
  const canShowExpand = !isChildren && (childs?.length || 0) > 1
  const [expand, setIsExpand] = useState(
    canShowExpand ? location.pathname.startsWith(`${APP_PATHS.PROFILE_MANAGE}${route}`) || defaultExpand : true,
  )
  const canShowListChildren = expand && !isChildren

  const { trackingHandler } = useTracking()
  const onClickMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    isChildren && onChildrenClick?.()
    if (onClick) {
      onClick()
      return
    }
    if (path.includes(PROFILE_MANAGE_ROUTES.PRICE_ALERTS))
      trackingHandler(TRACKING_EVENT_TYPE.PA_CLICK_TAB_IN_NOTI_CENTER)
    canShowExpand && setIsExpand(v => !v)
  }

  const totalUnread = type ? unread[type as PrivateAnnouncementType] : 0
  const isFirstParent = Boolean(!isChildren && index === 0)
  return (
    <>
      <Link
        to={onClick ? '#' : path}
        onClick={onClickMenu}
        className={cn(
          'block',
          isChildren || isFirstParent ? 'border-t-0' : 'border-t border-solid border-border',
          isChildren || !expand ? 'border-b-0' : 'border-b border-solid border-border',
        )}
      >
        <div
          data-active={isActive}
          style={style}
          className="flex cursor-pointer items-center gap-2 py-4 text-subText data-[active=true]:text-primary"
        >
          <div className="flex flex-1 items-center gap-2" style={{ color: isActive ? theme.primary : theme.subText }}>
            <div className="flex h-4 flex-[0_0_16px] items-center justify-center">{icon}</div>
            <span className="break-words text-sm font-medium">{title}</span>
          </div>

          {totalUnread ? (
            <div
              className={cn(
                'rounded-[30px] px-1 py-0.5 text-xs font-medium leading-none text-textReverse',
                isActive ? 'bg-primary' : 'bg-subText',
              )}
            >
              {formatNumberOfUnread(totalUnread)}
            </div>
          ) : null}
          {canShowExpand && <DropdownArrowIcon rotate={expand} />}
        </div>
      </Link>
      {canShowListChildren && (
        <Column style={{ padding: '8px 0', marginLeft: '24px' }}>
          {childs?.map((el, i) => {
            return (
              <Fragment key={i}>
                <MenuItem
                  onChildrenClick={onChildrenClick}
                  isChildren
                  data={el}
                  unread={unread}
                  style={{ padding: '8px 0' }}
                />
                {el.divider && (
                  <div
                    style={{
                      margin: '8px 0',
                      width: '100%',
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  />
                )}
              </Fragment>
            )
          })}
        </Column>
      )}
    </>
  )
}

export default MenuItem
