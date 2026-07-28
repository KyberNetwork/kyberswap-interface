import React, { useEffect, useState } from 'react'

import { cn } from 'utils/cn'

const customOptionClasses =
  'h-full rounded-[20px] border-transparent px-2 text-center text-xs font-normal leading-4 text-subText outline-none inline-flex items-center justify-center hover:bg-background-60 data-[active=true]:border-primary data-[active=true]:bg-background data-[active=true]:font-medium data-[active=true]:text-text data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50'

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return ''
  const fixed = Number(value.toFixed(4))
  const text = fixed.toString()
  return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

type Props = {
  value: number | null
  onChange: (value: number) => void
  isCustom?: boolean
  disabled?: boolean
}

const CustomFeeTierInput: React.FC<Props> = ({ value, onChange, isCustom, disabled }) => {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!isCustom || value === null) {
      setText('')
      return
    }
    setText(formatPercentValue(value))
  }, [isCustom, value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const next = event.target.value

    if (next === '') {
      setText(next)
      return
    }

    const numberRegex = /^(\d{0,3})(\.\d{0,5})?$/
    if (!numberRegex.test(next)) return

    const parsed = Number(next)
    if (Number.isNaN(parsed)) return

    setText(next)
    onChange(parsed)
  }

  return (
    <div
      data-active={isCustom}
      data-disabled={disabled}
      className={cn(customOptionClasses, 'flex-1 cursor-text gap-1')}
    >
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Custom"
        inputMode="decimal"
        disabled={disabled}
        className="h-full w-[54px] border-0 bg-transparent py-1 pl-1 pr-0 text-right text-inherit outline-none placeholder:text-inherit placeholder:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      %
    </div>
  )
}

export default CustomFeeTierInput
