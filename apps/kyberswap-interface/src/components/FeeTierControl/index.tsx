import React, { useEffect } from 'react'

import { cn } from 'utils/cn'

import CustomFeeTierInput from './CustomFeeTierInput'

const optionBaseClasses =
  'h-full rounded-[20px] border-transparent bg-transparent px-3 text-center text-xs font-normal leading-4 text-subText outline-none hover:bg-background-60 data-[active=true]:bg-background data-[active=true]:font-medium data-[active=true]:text-text data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 disabled:cursor-not-allowed disabled:opacity-50'

const DEFAULT_FEE_OPTIONS = [0.1, 0.3, 0.5, 1]

type Props = {
  value: number | null
  onChange: (value: number) => void
  options?: number[]
  disabled?: boolean
  className?: string
}

const FeeTierControl: React.FC<Props> = ({ value, onChange, options = DEFAULT_FEE_OPTIONS, disabled, className }) => {
  const [isCustom, setIsCustom] = React.useState(false)

  useEffect(() => {
    setIsCustom(false)
  }, [options])

  return (
    <div className={cn('flex h-9 w-full items-stretch rounded-[20px] border border-border', className)}>
      {options.map(option => (
        <button
          type="button"
          key={option}
          onClick={() => {
            onChange(option)
            setIsCustom(false)
          }}
          data-active={option === value && !isCustom}
          data-disabled={disabled}
          disabled={disabled}
          className={cn(optionBaseClasses, 'flex-1 cursor-pointer')}
        >
          {option}%
        </button>
      ))}
      <CustomFeeTierInput
        value={value}
        onChange={v => {
          onChange(v)
          setIsCustom(true)
        }}
        isCustom={isCustom}
      />
    </div>
  )
}

export default FeeTierControl

export { optionBaseClasses }
