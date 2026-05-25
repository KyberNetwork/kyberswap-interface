import React from 'react'

import { cn } from 'utils/cn'

import CustomClaimThresholdInput from './CustomClaimThresholdInput'

const DEFAULT_CLAIM_THRESHOLD_OPTIONS = [0, 5, 10, 50]

const claimOptionClasses =
  'h-full min-h-8 flex-1 rounded-[20px] border-transparent bg-transparent px-3 text-center text-sm font-normal leading-4 text-subText outline-none cursor-pointer hover:bg-tabActive-80 data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text'

type Props = {
  value?: number
  onChange?: (value: number) => void
  options?: number[]
}

const ClaimThresholdControl: React.FC<Props> = ({ value, onChange, options = DEFAULT_CLAIM_THRESHOLD_OPTIONS }) => {
  const [isCustom, setIsCustom] = React.useState(value !== undefined && !options.includes(value))
  const [internalValue, setInternalValue] = React.useState(0)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value ?? null : internalValue

  const handleValueChange = (next: number) => {
    setInternalValue(next)
    onChange?.(next)
  }

  return (
    <div className="flex h-9 items-stretch rounded-[20px] border border-border">
      {options.map(option => (
        <button
          type="button"
          key={option}
          onClick={() => {
            handleValueChange(option)
            setIsCustom(false)
          }}
          data-active={option === currentValue && !isCustom}
          className={cn(claimOptionClasses)}
        >
          ${option}
        </button>
      ))}
      <CustomClaimThresholdInput
        value={currentValue}
        onChange={nextValue => {
          handleValueChange(nextValue || 0)
          setIsCustom(nextValue !== null)
        }}
        isCustom={isCustom}
        maxDecimalDigits={4}
        maxIntegerDigits={4}
      />
    </div>
  )
}

export default ClaimThresholdControl
