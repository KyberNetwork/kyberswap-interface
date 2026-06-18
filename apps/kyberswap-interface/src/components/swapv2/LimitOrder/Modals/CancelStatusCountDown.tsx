import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Check } from 'react-feather'

import { ReactComponent as TimerIcon } from 'assets/svg/clock_timer.svg'
import Column from 'components/Column'
import { Clock } from 'components/Icons'
import WarningIcon from 'components/Icons/WarningIcon'
import Loader from 'components/Loader'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import { DOCS_LINKS } from 'components/swapv2/LimitOrder/helpers'
import useInterval from 'hooks/useInterval'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { formatRemainTime } from 'utils/time'

const CountDownWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-col items-center gap-2 rounded-2xl bg-buttonBlack/30 p-3', className)}>{children}</div>
)

const CancelStatusCountDown = ({
  expiredTime,
  cancelStatus,
  setCancelStatus,
  flowState,
}: {
  expiredTime: number
  cancelStatus: CancelStatus
  setCancelStatus: (v: CancelStatus) => void
  flowState: TransactionFlowState
}) => {
  const { errorMessage, attemptingTxn } = flowState
  const pendingText = flowState.pendingText || t`Canceling order`

  const [remain, setRemain] = useState(0)
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN

  useEffect(() => {
    const delta = Math.floor(expiredTime - Date.now() / 1000)
    setRemain(Math.max(0, delta))
  }, [expiredTime])

  const countdown = useCallback(() => {
    setRemain(v => {
      if (v - 1 === 0) {
        setCancelStatus(CancelStatus.CANCEL_DONE)
      }
      return Math.max(0, v - 1)
    })
  }, [setCancelStatus])

  useInterval(countdown, remain > 0 && isCountDown ? 1000 : null)

  const contentCountDown = isCountDown ? (
    <CountDownWrapper>
      <span className="text-sm font-normal text-text">
        <Trans>Order will be automatically cancelled in</Trans>
      </span>
      <div className="flex items-center gap-1.5 text-lg font-medium text-red">
        <Clock className="text-red" size={16} /> <span className="leading-5">{formatRemainTime(remain)}</span>
      </div>
      <span className="text-[10px] font-normal text-subText">
        <Trans>*There is a possibility that the order might be filled before cancellation.</Trans>{' '}
        <ExternalLink href={DOCS_LINKS.CANCEL_GUIDE}>
          <Trans>Learn more ↗︎</Trans>
        </ExternalLink>
      </span>
    </CountDownWrapper>
  ) : null

  if (errorMessage || attemptingTxn)
    return (
      <Column className="gap-[14px]">
        {contentCountDown}
        <CountDownWrapper className="min-h-[50px] flex-row justify-center">
          {errorMessage ? (
            <>
              <WarningIcon className="text-red" />
              <span className="text-sm text-red">{friendlyError(errorMessage)}</span>
            </>
          ) : (
            <>
              <Loader /> <span className="text-sm">{pendingText}</span>
            </>
          )}
        </CountDownWrapper>
      </Column>
    )

  if (cancelStatus === CancelStatus.WAITING) return null

  if (isCountDown) return contentCountDown

  return (
    <CountDownWrapper>
      {cancelStatus === CancelStatus.TIMEOUT ? (
        <div className="flex items-center gap-1 text-sm font-normal text-red">
          <TimerIcon />{' '}
          <div className="flex gap-1">
            <Trans>Your request has timed out.</Trans>{' '}
            <span className="self-end text-[10px] font-normal">
              <ExternalLink href={DOCS_LINKS.CANCEL_GUIDE}>
                <Trans>Learn more ↗︎</Trans>
              </ExternalLink>
            </span>
          </div>
        </div>
      ) : cancelStatus === CancelStatus.CANCEL_DONE ? (
        <div className="flex items-center gap-1.5 text-sm font-normal text-primary">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary-30">
            <Check size={14} />
          </div>{' '}
          <Trans>Order has been successfully cancelled.</Trans>
        </div>
      ) : null}
    </CountDownWrapper>
  )
}

export default CancelStatusCountDown
