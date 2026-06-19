import { Trans, t } from '@lingui/macro'
import { ButtonHTMLAttributes } from 'react'
import { Calendar, ChevronDown } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { TIMES_IN_SECS } from 'constants/index'
import { cn } from 'utils/cn'

const ExpireOptionButton = ({
  active,
  custom,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; custom?: boolean }) => (
  <button
    type="button"
    className={cn(
      'h-8 min-w-0 rounded-full border px-2 text-xs font-medium transition-colors',
      active && custom
        ? 'border-primary-50 bg-primary-20 text-primary shadow-[0_0_0_1px_rgba(49,203,158,0.12)]'
        : active
        ? 'border-primary-50 bg-tabActive text-text shadow-[0_0_0_1px_rgba(49,203,158,0.12)]'
        : custom
        ? 'border-dashed border-border bg-background/40 text-text hover:border-primary-50 hover:bg-primary-20 hover:text-primary'
        : 'border-transparent bg-transparent text-subText hover:border-border hover:bg-buttonGray hover:text-text',
      className,
    )}
    {...props}
  />
)

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

const LimitOrderExpirySection = ({
  expiry: { expire, expanded, customDateExpire, displayTime } = {},
  events = {},
}: Props) => {
  const expirePresetOptions = [
    { value: TIMES_IN_SECS.ONE_HOUR, label: t`1 Hour` },
    { value: TIMES_IN_SECS.ONE_DAY, label: t`1 Day` },
    { value: 7 * TIMES_IN_SECS.ONE_DAY, label: t`7 Days` },
    { value: 30 * TIMES_IN_SECS.ONE_DAY, label: t`30 Days` },
    { value: 36500 * TIMES_IN_SECS.ONE_DAY, label: t`Never Expires` },
  ]
  const expireOptions: Array<{ label: string; value?: number; onSelect?: () => void; custom?: boolean }> = [
    ...expirePresetOptions,
    { label: t`Custom Date`, onSelect: events.onOpenDatePicker, custom: true },
  ]
  const fullDisplayTime = customDateExpire
    ? displayTime
    : expirePresetOptions.find(item => item.value === expire)?.label || displayTime

  return (
    <Stack>
      <HStack className="items-center justify-between gap-1 text-subText">
        <HStack className="items-center gap-2">
          <TextDashed fontSize={14} className="flex h-fit items-center text-subText">
            <MouseoverTooltip
              placement="bottom"
              text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
            >
              <Trans>Expires In</Trans>:
            </MouseoverTooltip>
          </TextDashed>
          <HStack
            className="cursor-pointer items-center gap-1 hover:brightness-[0.85]"
            role="button"
            onClick={events.onToggleExpanded}
          >
            <span className="text-sm leading-none text-text/80">{fullDisplayTime}</span>
            <DropdownIcon size={14} data-flip={expanded}>
              <ChevronDown size={14} />
            </DropdownIcon>
          </HStack>
        </HStack>
      </HStack>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-2">
            <div className="grid w-full max-w-full grid-cols-3 gap-1 rounded-[20px] bg-tabBackground p-1">
              {expireOptions.map(item => {
                const active = customDateExpire ? item.custom : item.value === expire

                return (
                  <ExpireOptionButton
                    key={item.label}
                    onClick={() => {
                      if (item.onSelect) item.onSelect()
                      else if (item.value) events.onExpireChange?.(item.value)
                    }}
                    active={active}
                    custom={item.custom}
                  >
                    {item.custom ? (
                      <HStack as="span" className="items-center justify-center gap-1">
                        <Calendar size={12} />
                        {item.label}
                      </HStack>
                    ) : (
                      item.label
                    )}
                  </ExpireOptionButton>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Stack>
  )
}

export default LimitOrderExpirySection
