import { Trans, t } from '@lingui/macro'
import { Dispatch, SetStateAction } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { DefaultSlippageOption } from 'components/SlippageControl'
import { TextDashed } from 'components/Text'
import { MouseoverTooltip } from 'components/Tooltip'
import { getExpireOptions } from 'components/swapv2/LimitOrder/const'
import { cn } from 'utils/cn'

const DropdownIcon = ({ className, ...rest }: React.SVGProps<SVGSVGElement> & { 'data-flip'?: boolean }) => (
  <DropdownSVG
    className={cn('text-subText transition-transform duration-300 data-[flip=true]:rotate-180', className)}
    {...rest}
  />
)

type Props = {
  expire: number
  expanded: boolean
  customDateExpire: Date | undefined
  displayTime: string
  setExpanded: Dispatch<SetStateAction<boolean>>
  toggleDatePicker: () => void
  onChangeExpire: (val: Date | number) => void
}

export default function LimitOrderExpirySection({
  expire,
  expanded,
  customDateExpire,
  displayTime,
  setExpanded,
  toggleDatePicker,
  onChangeExpire,
}: Props) {
  const expireOptions: Array<{ label: string; value?: number; onSelect?: () => void }> = [
    ...getExpireOptions(),
    { label: 'Custom', onSelect: toggleDatePicker },
  ]

  return (
    <div>
      <div className="flex items-center gap-1">
        <TextDashed fontSize={12} fontWeight={500} className="flex h-fit items-center leading-none text-subText">
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires in</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <div className="flex cursor-pointer items-center gap-1" role="button" onClick={() => setExpanded(e => !e)}>
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
                  else if (item.value) onChangeExpire(item.value)
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
