import { Trans, t } from '@lingui/macro'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { DefaultSlippageOption } from 'components/SlippageControl'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { TIMES_IN_SECS } from 'constants/index'
import { cn } from 'utils/cn'
import { formatTimeDuration } from 'utils/time'

const DropdownIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement> & { 'data-flip'?: boolean }) => (
  <DropdownSVG
    className={cn('text-subText transition-transform duration-300 data-[flip=true]:rotate-180', className)}
    {...rest}
  />
)

const getExpireOptions = () =>
  [
    TIMES_IN_SECS.ONE_HOUR,
    TIMES_IN_SECS.ONE_DAY,
    7 * TIMES_IN_SECS.ONE_DAY,
    30 * TIMES_IN_SECS.ONE_DAY,
    36500 * TIMES_IN_SECS.ONE_DAY,
  ].map(value => ({ value, label: formatTimeDuration(value) }))

type Props = {
  expiry?: {
    expire?: number
    expanded?: boolean
    customDateExpire?: Date
    displayTime?: string
  }
  events?: {
    onToggleExpanded?: () => void
    onOpenDatePicker?: () => void
    onExpireChange?: (val: Date | number) => void
  }
}

export default function LimitOrderExpirySection({
  expiry: { expire, expanded, customDateExpire, displayTime } = {},
  events = {},
}: Props) {
  const expireOptions: Array<{ label: string; value?: number; onSelect?: () => void }> = [
    ...getExpireOptions(),
    { label: 'Custom', onSelect: events.onOpenDatePicker },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TextDashed fontSize={14} fontWeight={500} className="flex h-fit items-center leading-none text-subText">
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires In</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <div className="flex cursor-pointer items-center gap-1" role="button" onClick={events.onToggleExpanded}>
          <span className="text-sm font-medium leading-none text-text">{displayTime}</span>
          <DropdownIcon data-flip={expanded} />
        </div>
      </div>

      <div className={cn('flex overflow-hidden transition-all duration-100', expanded ? 'h-9 pt-2' : 'h-0 pt-0')}>
        <div className="flex h-7 w-full max-w-full justify-between rounded-[20px] bg-tabBackground p-0.5">
          {expireOptions.map(item => {
            return (
              <DefaultSlippageOption
                key={item.label}
                onClick={() => {
                  if (item.onSelect) item.onSelect()
                  else if (item.value) events.onExpireChange?.(item.value)
                }}
                data-active={customDateExpire ? item.label === 'Custom' : item.value === expire}
              >
                {item.label}
              </DefaultSlippageOption>
            )
          })}
        </div>
      </div>
    </div>
  )
}
