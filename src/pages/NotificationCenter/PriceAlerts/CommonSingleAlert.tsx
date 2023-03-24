import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as AlarmIcon } from 'assets/svg/alarm.svg'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import AlertCondition, { AlertConditionData } from 'pages/NotificationCenter/PriceAlerts/AlertCondition'
import { PriceAlert } from 'pages/NotificationCenter/const'

const Wrapper = styled.div`
  padding: 20px 0;

  display: flex;
  flex-direction: column;
  gap: 12px;

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
    gap: 12px;

    ${TimeText} {
      font-size: 12px;
    }
  `}
`

const SupplementaryTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px 16px;
  justify-content: space-between;
  flex-wrap: wrap;

  font-size: 12px;
  white-space: nowrap;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    ${EmptySupplementaryText} {
      display: none;
    }
  `}
`

const EmptySupplementaryText = styled.span``

type Props = {
  renderToggle?: () => React.ReactNode
  renderDeleteButton?: () => React.ReactNode
  timeText?: React.ReactNode
  isHistorical?: boolean
  alertData: Pick<PriceAlert, 'note'> & Partial<Pick<PriceAlert, 'disableAfterTrigger'>> & AlertConditionData
}
const CommonSingleAlert: React.FC<Props> = ({
  renderToggle,
  renderDeleteButton,
  timeText,
  isHistorical = false,
  alertData,
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
        <AlertCondition alertData={alertData} shouldIncludePrefix={!isHistorical} />

        <TimeText>{timeText}</TimeText>
      </AlertConditionWrapper>

      {alertData.note || alertData.disableAfterTrigger ? (
        <SupplementaryTextWrapper>
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
          ) : (
            <EmptySupplementaryText />
          )}

          {alertData.disableAfterTrigger ? (
            <Text
              as="span"
              sx={{
                whiteSpace: 'nowrap',
              }}
            >
              <Trans>This alert will be disabled after its triggered once</Trans>
            </Text>
          ) : (
            <EmptySupplementaryText />
          )}
        </SupplementaryTextWrapper>
      ) : null}
    </Wrapper>
  )
}

export default CommonSingleAlert
