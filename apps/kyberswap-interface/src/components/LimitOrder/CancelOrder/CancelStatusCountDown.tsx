import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { Clock } from 'components/Icons'
import { DOCS_LINKS } from 'components/LimitOrder/helpers'
import useInterval from 'hooks/useInterval'
import { ExternalLink } from 'theme'
import { formatRemainTime } from 'utils/time'

const CancelStatusCountDown = ({
  expiredTime,
  onCountdownEnd,
}: {
  expiredTime: number
  onCountdownEnd: () => void
}) => {
  const [remain, setRemain] = useState(0)

  useEffect(() => {
    const delta = Math.floor(expiredTime - Date.now() / 1000)
    setRemain(Math.max(0, delta))
  }, [expiredTime])

  const countdown = useCallback(() => {
    setRemain(v => {
      if (v <= 1) {
        onCountdownEnd()
        return 0
      }
      return v - 1
    })
  }, [onCountdownEnd])

  useInterval(countdown, remain > 0 ? 1000 : null)

  if (!remain) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-darkBorder bg-white-04 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-text">
        <Trans>Order will be automatically cancelled in</Trans>
        <span className="inline-flex items-center gap-2 text-red">
          <Clock className="text-red" size={16} />
          <span>{formatRemainTime(remain)}</span>
        </span>
      </div>
      <span className="text-xs text-subText">
        <Trans>Note: There is a possibility that the order might be filled before cancellation.</Trans>{' '}
        <ExternalLink href={DOCS_LINKS.CANCEL_GUIDE}>
          <Trans>Learn more ↗︎</Trans>
        </ExternalLink>
      </span>
    </div>
  )
}

export default CancelStatusCountDown
