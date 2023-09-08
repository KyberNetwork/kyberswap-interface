import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as TimerIcon } from 'assets/svg/clock_timer.svg'
import { NotificationType } from 'components/Announcement/type'
import { Clock } from 'components/Icons'
import WarningIcon from 'components/Icons/WarningIcon'
import Loader from 'components/Loader'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { friendlyError } from 'utils/errorMessage'
import { formatRemainTime } from 'utils/time'

const SuccessIcon = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CountDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => rgba(theme.buttonBlack, 0.3)};
  border-radius: 16px;
  padding: 12px;
  align-items: center;
`

const Timer = styled.div`
  color: ${({ theme }) => theme.red};
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

export default function CancelStatusCountDown({
  expiredTime,
  cancelStatus,
  setCancelStatus,
  flowState,
}: {
  expiredTime: number
  cancelStatus: CancelStatus
  setCancelStatus: (v: CancelStatus) => void
  flowState: TransactionFlowState
}) {
  const { errorMessage, attemptingTxn } = flowState
  const pendingText = flowState.pendingText || t`Canceling order`

  const theme = useTheme()
  const notify = useNotify()

  const [remain, setRemain] = useState(0)
  useEffect(() => {
    setRemain(Math.floor(expiredTime - Date.now() / 1000))
  }, [expiredTime])

  const countdown = useCallback(() => {
    setRemain(v => {
      if (v - 1 === 0) {
        setCancelStatus(CancelStatus.TIMEOUT)
        notify({
          summary: t`Your cancellation request has timed out.`,
          title: t`Limit Order`,
          type: NotificationType.ERROR,
          // todo btn
        })
      }
      return v - 1
    })
  }, [setCancelStatus, notify])

  useInterval(countdown, remain && cancelStatus === CancelStatus.COUNTDOWN ? 1000 : null)

  // todo

  if (errorMessage || attemptingTxn)
    return (
      <CountDownWrapper style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {errorMessage ? (
          <>
            <WarningIcon color={theme.red} />
            <Text fontSize={'14px'} color={theme.red}>
              {friendlyError(errorMessage)}
            </Text>
          </>
        ) : (
          <>
            <Loader /> <Text fontSize={'14px'}>{pendingText}</Text>
          </>
        )}
      </CountDownWrapper>
    )

  if (cancelStatus === CancelStatus.WAITING) return null

  return (
    <CountDownWrapper>
      {cancelStatus === CancelStatus.TIMEOUT ? (
        <Flex fontSize={'14px'} fontWeight={'400'} color={theme.red} alignItems={'center'} sx={{ gap: '4px' }}>
          <TimerIcon />{' '}
          <Flex sx={{ gap: '4px' }}>
            Your request has timed out.{' '}
            <Text fontSize={'10px'} fontWeight={'400'} alignSelf={'flex-end'}>
              <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
            </Text>
          </Flex>
        </Flex>
      ) : cancelStatus === CancelStatus.CANCEL_DONE ? (
        <Flex fontSize={'14px'} fontWeight={'400'} color={theme.primary} alignItems={'center'} sx={{ gap: '6px' }}>
          <SuccessIcon>
            <Check size={14} />
          </SuccessIcon>{' '}
          Order has been successfully cancelled.
        </Flex>
      ) : (
        <>
          <Text fontSize={'14px'} fontWeight={'400'} color={theme.text}>
            <Trans>Once submitted, the orders will be automatically cancelled in</Trans>
          </Text>
          <Timer>
            <Clock color={theme.red} size={16} /> <Text lineHeight={'20px'}>{formatRemainTime(remain)}</Text>
          </Timer>
          <Text fontSize={'10px'} fontWeight={'400'} color={theme.subText}>
            *There is a possibility that the order might be filled before cancellation.{' '}
            <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
          </Text>
        </>
      )}
    </CountDownWrapper>
  )
}
