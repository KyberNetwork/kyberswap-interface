import { t } from '@lingui/macro'
import { Clock, List as ListIcon, Mail } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as DropIcon } from 'assets/svg/drop.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuItem from 'pages/NotificationCenter/Menu/MenuItem'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const Divider = styled.div<{ $margin?: string }>`
  height: 0;
  width: 100%;
  padding: 0 24px;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: ${({ $margin }) => $margin || '0'};
`

const Menu = () => {
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
        <MenuItem href={NOTIFICATION_ROUTES.ALL} icon={<ListIcon size="16px" />} text={t`All Notifications`} />
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
            <MenuItem href={NOTIFICATION_ROUTES.GENERAL} icon={<Mail size="16px" />} text={t`General`} />
            <Divider />
            <MenuItem
              href={NOTIFICATION_ROUTES.PRICE_ALERTS}
              icon={<Clock width={16} height={16} />}
              text={t`Price Alerts`}
            />
          </Flex>

          <MenuItem
            href={NOTIFICATION_ROUTES.MY_ELASTIC_POOLS}
            icon={<DropIcon width="16px" height="16px" />}
            text={t`My Elastic Pools`}
          />
          <MenuItem href={NOTIFICATION_ROUTES.LIMIT_ORDERS} icon={<LimitOrderIcon />} text={t`Limit Orders`} />
          <MenuItem
            href={NOTIFICATION_ROUTES.BRIDGE}
            icon={<BridgeIcon width="16px" height="16px" />}
            text={t`Cross-Chain Bridge`}
            badgeText={'10'}
          />
          <MenuItem
            href={NOTIFICATION_ROUTES.TRENDING_SOON_TOKENS}
            icon={<DiscoverIcon size={16} />}
            text={t`Trending Soon Tokens`}
            badgeText={'10+'}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Menu
