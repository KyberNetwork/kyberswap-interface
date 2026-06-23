import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Check } from 'react-feather'

import Column from 'components/Column'
import { Clock } from 'components/Icons'
import WarningIcon from 'components/Icons/WarningIcon'
import { CancelStatus } from 'components/LimitOrder/CancelOrder/types'
import { DOCS_LINKS } from 'components/LimitOrder/helpers'
import Loader from 'components/Loader'
import useInterval from 'hooks/useInterval'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { formatRemainTime } from 'utils/time'

const CountDownWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn('flex flex-col items-center gap-2 rounded-xl border border-darkBorder bg-white-04 p-3', className)}
  >
    {children}
  </div>
)

const CancelStatusCountDown = ({
  expiredTime,
  cancelStatus,
  setCancelStatus,
  attemptingTxn,
  errorMessage,
}: {
  expiredTime: number
  cancelStatus: CancelStatus
  setCancelStatus: (v: CancelStatus) => void
  attemptingTxn: boolean
  errorMessage: string
}) => {
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
    <CountDownWrapper className="items-start">
      <span className="text-sm font-medium text-text">
        <Trans>Order will be automatically cancelled in</Trans>
      </span>
      <div className="flex items-center gap-1.5 text-lg font-medium text-red">
        <Clock className="text-red" size={16} /> <span className="leading-5">{formatRemainTime(remain)}</span>
      </div>
      <span className="text-xs leading-4 text-subText">
        <Trans>*There is a possibility that the order might be filled before cancellation.</Trans>{' '}
        <ExternalLink href={DOCS_LINKS.CANCEL_GUIDE}>
          <Trans>Learn more ↗︎</Trans>
        </ExternalLink>
      </span>
    </CountDownWrapper>
  ) : null

  if (cancelStatus === CancelStatus.CANCEL_DONE)
    return (
      <CountDownWrapper>
        <div className="flex items-center gap-1.5 text-sm font-normal text-primary">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary-30">
            <Check size={14} />
          </div>{' '}
          <Trans>Order has been successfully cancelled.</Trans>
        </div>
      </CountDownWrapper>
    )

  if (errorMessage || attemptingTxn)
    return (
      <Column className="gap-[14px]">
        {contentCountDown}
        <CountDownWrapper className="min-h-[52px] flex-row justify-center">
          {errorMessage ? (
            <>
              <WarningIcon className="text-red" />
              <span className="text-sm leading-5 text-red">{friendlyError(errorMessage)}</span>
            </>
          ) : (
            <>
              <Loader /> <span className="text-sm">{t`Canceling order`}</span>
            </>
          )}
        </CountDownWrapper>
      </Column>
    )

  if (cancelStatus === CancelStatus.WAITING) return null

  if (isCountDown) return contentCountDown

  return null
}

export default CancelStatusCountDown
