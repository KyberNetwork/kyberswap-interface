import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flex } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { formatNumberOfUnread } from 'components/Announcement/helper'
import { PrivateAnnouncementType } from 'components/Announcement/type'
import { DropdownArrowIcon } from 'components/ArrowRotate'
import Column from 'components/Column'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { MenuItemType, Unread } from 'pages/NotificationCenter/Menu'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const IconWrapper = styled.div`
  height: 16px;
  flex: 0 0 16px;
  justify-content: center;
  align-items: center;
`

const Label = styled.span`
  font-weight: 500;
  font-size: 14px;
  overflow-wrap: break-word;
`

const Badge = styled.div`
  padding: 2px 4px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  background: ${({ theme }) => theme.subText};
  color: ${({ theme }) => theme.textReverse};
`

const StyledLink = styled(Link)<{ $isChildren?: boolean }>`
  border-bottom: ${({ theme, $isChildren }) => !$isChildren && `1px solid ${theme.border}`};
  :last-child {
    border: none;
  }
`

type WrapperProps = {
  $active: boolean
}
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-active': props.$active,
}))<WrapperProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  padding: 14px 0;
  cursor: pointer;

  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};

    ${Badge} {
      background-color: ${({ theme }) => theme.primary};
    }
  }
`

type Props = {
  isMobile?: boolean
  style?: CSSProperties
  unread: Unread
  data: MenuItemType
  isChildren?: boolean
  onClickItem?: () => void
}

const MenuItem: React.FC<Props> = ({ data, style, unread, isChildren, onClickItem }) => {
  const { icon, title, route, childs, type, onClick } = data
  const location = useLocation()
  const theme = useTheme()

  const path = `${APP_PATHS.NOTIFICATION_CENTER}${route}`
  const isActive = location.pathname === path || location.pathname === path.substring(0, path.length - 1)

  const [expand, setIsExpand] = useState(location.pathname.startsWith(`${APP_PATHS.NOTIFICATION_CENTER}${route}`))
  const canShowExpand = !isChildren
  const canShowListChildren = expand && !isChildren

  const { mixpanelHandler } = useMixpanel()
  const onClickMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    isChildren && onClickItem?.() // todo rename
    if (onClick) {
      onClick()
      return
    }
    if (path.includes(NOTIFICATION_ROUTES.PRICE_ALERTS)) mixpanelHandler(MIXPANEL_TYPE.PA_CLICK_TAB_IN_NOTI_CENTER)
    canShowExpand && setIsExpand(v => !v)
  }

  const totalUnread = type ? unread[type as PrivateAnnouncementType] : 0
  return (
    <>
      <StyledLink to={onClick ? '#' : path} onClick={onClickMenu} $isChildren={isChildren}>
        <Wrapper $active={isActive} style={style}>
          <Flex
            sx={{
              flex: '1 1 0',
              alignItems: 'center',
              color: isActive ? theme.primary : theme.subText,
              gap: '8px',
            }}
          >
            <IconWrapper>{icon}</IconWrapper>
            <Label>{title}</Label>
          </Flex>

          {totalUnread ? <Badge>{formatNumberOfUnread(totalUnread)}</Badge> : null}
          {childs?.length && <DropdownArrowIcon rotate={expand} />}
        </Wrapper>
        {canShowListChildren && (
          <Column style={{ padding: '8px 0', borderTop: `1px solid ${theme.border}`, marginLeft: '24px' }}>
            {childs?.map(el => {
              return (
                <>
                  <MenuItem
                    onClickItem={onClickItem}
                    isChildren
                    key={el.title}
                    data={el}
                    unread={unread}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                    }}
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
                </>
              )
            })}
          </Column>
        )}
      </StyledLink>
    </>
  )
}

export default MenuItem
