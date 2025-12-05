import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { Badge, BadgeType } from 'pages/Earns/UserPositions/styles'

export default function SmartExitActiveBadge({ hasActiveSmartExitOrder }: { hasActiveSmartExitOrder: boolean }) {
  const theme = useTheme()

  return (
    hasActiveSmartExitOrder && (
      <Flex px="24px" alignItems="center" sx={{ gap: '8px' }}>
        <Text fontSize={14} color={theme.subText}>
          <Trans>Smart Exit</Trans>
        </Text>
        <MouseoverTooltip
          text={
            <Box>
              <Text color={theme.subText}>
                <Trans>This position has an active Smart Exit order.</Trans>
              </Text>
              <Text color={theme.subText}>
                <Trans>View or manage it in</Trans>{' '}
                <Link to={APP_PATHS.EARN_SMART_EXIT}>
                  <Trans>View Smart Exit Orders</Trans>
                </Link>
                .
              </Text>
            </Box>
          }
          width="290px"
          placement="bottom"
          delay={200}
        >
          <Badge type={BadgeType.PRIMARY}>
            <Trans>Active</Trans>
          </Badge>
        </MouseoverTooltip>
      </Flex>
    )
  )
}
