import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'

import Tooltip from 'components/Tooltip'
import { DEFAULT_TIPS, MAX_FEE_IN_BIPS } from 'constants/trade'
import { cn } from 'utils/cn'
import { formatSlippage } from 'utils/slippage'

const parseTipInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)

const getFeeText = (fee: number, forceVisible = false) => {
  const isCustom = forceVisible || !DEFAULT_TIPS.includes(fee)
  if (!isCustom) {
    return ''
  }
  return formatSlippage(fee, false)
}

export type Props = {
  value: number
  isActive: boolean
  onActiveChange: (value: boolean) => void
  onChange: (value: number) => void
}

const CustomFeeInput = ({ value, isActive, onActiveChange, onChange }: Props) => {
  const [text, setText] = useState(getFeeText(value))
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const inputValue = e.target.value

    if (inputValue === '') {
      setText(inputValue)
      onActiveChange(false)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!inputValue.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseTipInput(inputValue)
    if (Number.isNaN(parsedValue)) {
      e.preventDefault()
      return
    }

    const maxCustomFee = MAX_FEE_IN_BIPS
    if (parsedValue > maxCustomFee) {
      const format = formatSlippage(maxCustomFee)
      setTooltip(t`Max is ${format}`)
      e.preventDefault()
      return
    }

    setText(inputValue)
    onActiveChange(true)
    onChange(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    const hasCustomText = text !== ''
    onActiveChange(hasCustomText || !DEFAULT_TIPS.includes(value))
    setText(getFeeText(value, hasCustomText))
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setText(getFeeText(value))
    }
  }, [value])

  const customTextClass = text ? 'text-text' : 'text-subText'

  return (
    <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
      <div
        className={cn(
          'flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-sm',
          isActive
            ? cn('bg-tabActive hover:bg-buttonGray', customTextClass)
            : 'bg-transparent text-subText hover:bg-buttonGray',
        )}
      >
        <input
          ref={inputRef}
          placeholder={t`Custom`}
          value={text}
          onChange={handleChangeInput}
          onBlur={handleCommitChange}
          onFocus={() => {
            onActiveChange(true)
          }}
          className="w-14 min-w-0 border-0 bg-transparent p-0 text-right text-[13px] font-medium text-inherit outline-none placeholder:text-inherit [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className={cn('text-sm', isActive && 'text-text')}>%</span>
      </div>
    </Tooltip>
  )
}

export default CustomFeeInput
