import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as AlarmIcon } from 'assets/svg/alarm.svg'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import AlertCondition, { Props as AlertConditionProps } from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { PriceAlert } from 'pages/NotificationCenter/const'

const Wrapper = styled.div`
  padding: 20px 0;

  display: flex;
  flex-direction: column;
  gap: 8px;

  border-bottom: 1px solid ${({ theme }) => theme.border};

  ${Toggle} {
    &[data-active='false'] {
      background: ${({ theme }) => theme.buttonBlack};
    }
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px 0;
  `}
`

const TimeText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  flex: 0 0 max-content;
  white-space: nowrap;
  line-height: 20px;
`

const AlertConditionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column-reverse;
    flex-wrap: wrap;
    gap: 8px;

    ${TimeText} {
      font-size: 12px;
    }
  `}
`

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
    <Wrapper>
      <Flex alignItems={'center'} justifyContent="space-between" height="24px">
        <Flex
          sx={{
            fontWeight: '500',
            fontSize: '14px',
            color: theme.subText,
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlarmIcon width={14} height={14} />
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

      <AlertConditionWrapper>
        <AlertCondition {...alertData} />

        <TimeText>{timeText}</TimeText>
      </AlertConditionWrapper>

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
    </Wrapper>
  )
}

export default CommonSingleAlert
