import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'

import Tooltip from 'components/Tooltip'
import { DEFAULT_TIPS, MAX_FEE_IN_BIPS } from 'constants/index'
import { cn } from 'utils/cn'
import { formatSlippage } from 'utils/slippage'

const parseTipInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)

const getFeeText = (fee: number) => {
  const isCustom = !DEFAULT_TIPS.includes(fee)
  if (!isCustom) {
    return ''
  }
  return formatSlippage(fee, false)
}

const customOptionClasses =
  'inline-flex h-full flex-1 basis-[24%] items-center gap-0.5 rounded-[20px] border border-transparent bg-tabBackground px-1 py-0 text-center text-xs font-normal leading-4 text-subText outline-none transition-all duration-150 ease-linear hover:border-bg4 focus:border-bg4 data-[active=true]:font-medium data-[active=true]:text-text'

export type Props = {
  fee: number
  onFeeChange: (value: number) => void
}

const CustomFeeInput = ({ fee, onFeeChange }: Props) => {
  const [text, setText] = useState(getFeeText(fee))
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isCustomOptionActive = !DEFAULT_TIPS.includes(fee)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const value = e.target.value

    if (value === '') {
      setText(value)
      onFeeChange(50)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!value.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseTipInput(value)
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

    setText(value)
    onFeeChange(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    setText(getFeeText(fee))
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setText(getFeeText(fee))
    }
  }, [fee])

  return (
    <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
      <div data-active={isCustomOptionActive} className={cn(customOptionClasses)}>
        <input
          ref={inputRef}
          placeholder={t`Custom`}
          value={text}
          onChange={handleChangeInput}
          onBlur={handleCommitChange}
          className="size-full rounded-[inherit] border-0 bg-transparent text-inherit outline-none placeholder:text-xs max-[375px]:text-[10px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="basis-3">%</span>
      </div>
    </Tooltip>
  )
}

export default CustomFeeInput
