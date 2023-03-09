import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useUpdatePriceAlertMutation } from 'services/priceAlert'
import styled from 'styled-components'

import NotificationIcon from 'components/Icons/NotificationIcon'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import AlertCondition from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import DeleteSingleAlertButton from 'pages/NotificationCenter/PriceAlerts/DeleteSingleAlertButton'
import { PriceAlert } from 'pages/NotificationCenter/const'

const formatCooldown = (t: number) => {
  return dayjs.duration(t, 'seconds').humanize()
}

type Props = {
  alert: PriceAlert
  className?: string
}
const SingleAlert: React.FC<Props> = ({ alert, className }) => {
  const theme = useTheme()
  const [updateAlert] = useUpdatePriceAlertMutation()
  return (
    <Flex
      className={className}
      sx={{
        flexDirection: 'column',
        padding: '24px 0',
        borderBottom: '1px solid',
        borderBottomColor: theme.border,
        gap: '8px',
      }}
    >
      <Flex alignItems={'center'} justifyContent="space-between">
        <Flex
          sx={{
            fontWeight: '500',
            fontSize: '14px',
            color: theme.subText,
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Clock width={14} height={14} />
          <Text>Price Alert</Text>
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Toggle
            style={{ transform: 'scale(.8)', cursor: 'pointer' }}
            icon={<NotificationIcon size={16} color={theme.textReverse} />}
            isActive={alert.isEnabled}
            toggle={() => {
              updateAlert({ id: alert.id, isEnabled: !alert.isEnabled })
            }}
          />

          <DeleteSingleAlertButton alert={alert} />
        </Flex>
      </Flex>

      <Flex
        sx={{
          gap: '16px',
        }}
      >
        <AlertCondition alert={alert} />
        <Text
          sx={{
            fontSize: '14px',
            color: theme.subText,
            flex: '0 0 max-content',
            whiteSpace: 'nowrap',
            lineHeight: '20px',
          }}
        >
          Cooldown: {formatCooldown(alert.cooldown)}
        </Text>
      </Flex>

      {alert.note || alert.disableAfterTrigger ? (
        <Flex
          sx={{
            fontSize: '12px',
            color: theme.subText,
            whiteSpace: 'nowrap',
            lineHeight: '20px',
            rowGap: '8px',
            columnGap: '16px',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {alert.note ? (
            <Text
              as="span"
              sx={{
                whiteSpace: 'break-spaces',
                overflowWrap: 'anywhere',
              }}
            >
              <Trans>Note</Trans>: {alert.note}
            </Text>
          ) : null}

          {alert.disableAfterTrigger ? (
            <Text
              as="span"
              sx={{
                whiteSpace: 'nowrap',
              }}
            >
              <Trans>This alert will be disabled after its triggered once</Trans>
            </Text>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  )
}

export default styled(SingleAlert)`
  ${Toggle} {
    &[data-active='false'] {
      background: ${({ theme }) => theme.buttonBlack};
    }
  }
`
