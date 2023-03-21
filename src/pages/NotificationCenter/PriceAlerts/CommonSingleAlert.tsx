import { Trans } from '@lingui/macro'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import AlertCondition, { Props as AlertConditionProps } from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { PriceAlert } from 'pages/NotificationCenter/const'

type Props = {
  className?: string
  renderToggle?: () => React.ReactNode
  renderDeleteButton?: () => React.ReactNode
  timeText?: React.ReactNode
} & (Pick<PriceAlert, 'note'> & Partial<Pick<PriceAlert, 'disableAfterTrigger'>> & AlertConditionProps)
const CommonSingleAlert: React.FC<Props> = ({
  className,
  renderToggle,
  renderDeleteButton,
  timeText,
  ...alertData
}) => {
  const theme = useTheme()
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
          <span>
            <Trans>Price Alert</Trans>
          </span>
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {renderToggle?.()}
          {renderDeleteButton?.()}
        </Flex>
      </Flex>

      <Flex
        sx={{
          gap: '16px',
        }}
      >
        <AlertCondition {...alertData} />
        <Text
          sx={{
            fontSize: '14px',
            color: theme.subText,
            flex: '0 0 max-content',
            whiteSpace: 'nowrap',
            lineHeight: '20px',
          }}
        >
          {timeText}
        </Text>
      </Flex>

      {alertData.note || alertData.disableAfterTrigger ? (
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
          {alertData.note ? (
            <Text
              as="span"
              sx={{
                whiteSpace: 'break-spaces',
                overflowWrap: 'anywhere',
              }}
            >
              <Trans>Note</Trans>: {alertData.note}
            </Text>
          ) : null}

          {alertData.disableAfterTrigger ? (
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

export default styled(CommonSingleAlert)`
  ${Toggle} {
    &[data-active='false'] {
      background: ${({ theme }) => theme.buttonBlack};
    }
  }
`
