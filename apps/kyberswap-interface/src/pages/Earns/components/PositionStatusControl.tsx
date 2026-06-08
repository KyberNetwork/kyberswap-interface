import React, { useState } from 'react'

import { PositionStatus as EarnPositionStatus } from 'pages/Earns/types'

export type PositionStatus = EarnPositionStatus | 'all'

export type PositionStatusOption = {
  label: string
  value: PositionStatus
}

const OPTION_BUTTON_CLASS =
  'h-full cursor-pointer rounded-[20px] border border-solid border-border bg-transparent px-[22px] text-center text-sm font-normal leading-4 text-subText outline-none hover:bg-tabActive max-sm:px-3 max-sm:text-xs data-[active=true]:border-primary-50 data-[active=true]:bg-primary-20 data-[active=true]:font-medium data-[active=true]:text-text'

export const POSITION_STATUS_OPTIONS: PositionStatusOption[] = [
  { label: 'All', value: 'all' },
  { label: 'In Range', value: EarnPositionStatus.IN_RANGE },
  { label: 'Out of Range', value: EarnPositionStatus.OUT_RANGE },
  { label: 'Closed', value: EarnPositionStatus.CLOSED },
]

type Props = {
  value?: PositionStatus
  onChange?: (value: PositionStatus) => void
  options?: PositionStatusOption[]
}

const PositionStatusControl: React.FC<Props> = ({ value, onChange, options = POSITION_STATUS_OPTIONS }) => {
  const [internalValue, setInternalValue] = useState<PositionStatus>(options[0].value)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value ?? options[0].value : internalValue

  const handleChange = (next: PositionStatus) => {
    setInternalValue(next)
    onChange?.(next)
  }

  return (
    <div className="flex h-9 items-stretch justify-between">
      {options.map(option => (
        <button
          type="button"
          key={option.value}
          onClick={() => handleChange(option.value)}
          data-active={option.value === currentValue}
          className={OPTION_BUTTON_CLASS}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default PositionStatusControl
