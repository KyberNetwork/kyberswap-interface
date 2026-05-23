import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { formatDisplayNumber } from 'utils/numbers'

export default function MoreInfo({
  deadline,
  protocolFee,
  maxGas,
}: {
  deadline: number
  protocolFee: number
  maxGas: number
}) {
  const theme = useTheme()
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const remainingSeconds = deadline - nowInSeconds
  const isForever = remainingSeconds >= FOREVER_EXPIRE_TIME - TIMES_IN_SECS.ONE_DAY
  const displayTime = isForever ? 'Forever' : dayjs(deadline * 1000).format('DD/MM/YYYY HH:mm:ss')

  return (
    <>
      <div className="mt-4 flex justify-between">
        <span className="text-sm text-subText">
          <Trans>Platform Fee</Trans>
        </span>
        <span className="text-sm text-text">{protocolFee}%</span>
      </div>

      <div className="mt-4 flex justify-between">
        <TextDashed color={theme.subText} fontSize={14} className="flex h-fit items-center">
          <MouseoverTooltip
            placement="right"
            text={t`The actual gas cost will be deducted from your outputs when the order executes.`}
          >
            <Trans>Max Execution Gas</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <span className="text-sm text-text">{formatDisplayNumber(maxGas, { significantDigits: 4 })}%</span>
      </div>

      <div className="mt-4 flex justify-between">
        <TextDashed color={theme.subText} fontSize={14} className="flex h-fit items-center">
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires in</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <span className="text-sm text-text">{displayTime}</span>
      </div>
    </>
  )
}
