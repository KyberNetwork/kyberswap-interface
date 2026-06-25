import React, { useEffect, useMemo, useState } from 'react'

const customOptionClasses =
  'inline-flex h-full flex-1 cursor-text items-center justify-center gap-1 rounded-[20px] border-transparent px-2 text-center text-sm font-normal leading-4 text-subText outline-none hover:bg-tabActive-80 data-[active=true]:border-primary data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text'

export const formatThresholdValue = (value?: number) => {
  const number = (value ?? 0)
    .toString()
    .replace(/\.0+$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1')
  return '$' + number
}

type Props = {
  value: number | null
  onChange: (value: number | null) => void
  isCustom?: boolean
  placeholder?: string
  maxIntegerDigits?: number
  maxDecimalDigits?: number
}

const CustomClaimThresholdInput: React.FC<Props> = ({
  value,
  onChange,
  isCustom,
  placeholder = 'Custom',
  maxIntegerDigits = 6,
  maxDecimalDigits = 2,
}) => {
  const [text, setText] = useState('')

  const numberRegex = useMemo(() => {
    const decimalPattern = maxDecimalDigits > 0 ? `(\\.\\d{0,${maxDecimalDigits}})?` : ''
    return new RegExp(`^(\\d{0,${maxIntegerDigits}})${decimalPattern}$`)
  }, [maxDecimalDigits, maxIntegerDigits])

  useEffect(() => {
    if (!isCustom || value === null) {
      setText('')
      return
    }
    setText(formatThresholdValue(value))
  }, [isCustom, maxDecimalDigits, value])

  const handleStep = (delta: number) => {
    const base = value ?? 0
    const next = Math.max(0, base + delta)
    const nextText = next.toString()
    if (!numberRegex.test(nextText)) return

    setText(formatThresholdValue(next))
    onChange(next)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/^\$/, '')

    if (next === '') {
      setText('')
      onChange(null)
      return
    }

    if (!numberRegex.test(next)) return

    setText(`$${next}`)
    onChange(+next)
  }

  return (
    <div data-active={isCustom} className={customOptionClasses}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={event => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            handleStep(1)
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            handleStep(-1)
          }
        }}
        placeholder={placeholder}
        inputMode="decimal"
        step={1}
        className="h-full w-[60px] min-w-0 border-0 bg-transparent py-1 text-center text-inherit outline-none placeholder:text-inherit placeholder:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  )
}

export default CustomClaimThresholdInput
