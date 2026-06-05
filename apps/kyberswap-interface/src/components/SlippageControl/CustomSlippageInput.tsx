import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import Tooltip from 'components/Tooltip'
import { APP_PATHS, MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'
import { formatSlippage } from 'utils/slippage'

const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)
const getSlippageText = (value: number, options: number[], forceVisible = false) => {
  const isCustom = forceVisible || !options.includes(value)
  if (!isCustom) {
    return ''
  }

  return formatSlippage(value, false)
}

export type Props = {
  value: number
  isActive: boolean
  onActiveChange: (value: boolean) => void
  onFocusChange?: (value: boolean) => void
  onChange: (value: number) => void
  isWarning: boolean
  isHighlight?: boolean
  options: number[]
}

const CustomSlippageInput: React.FC<Props> = ({
  value,
  isActive,
  onActiveChange,
  onFocusChange,
  onChange,
  isWarning,
  isHighlight,
  options,
}) => {
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const previousSlippageRef = useRef(value)
  const { trackingHandler } = useTracking()
  const { pathname } = useLocation()
  const isCrossChain = pathname.startsWith(APP_PATHS.CROSS_CHAIN)
  const [isDegenMode] = useDegenModeManager()
  const [rawText, setRawText] = useState(getSlippageText(value, options))

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const inputValue = e.target.value

    if (inputValue === '') {
      setRawText(inputValue)
      onActiveChange(false)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!inputValue.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseSlippageInput(inputValue)
    if (Number.isNaN(parsedValue)) {
      e.preventDefault()
      return
    }

    const maxSlippage = isDegenMode ? MAX_DEGEN_SLIPPAGE_IN_BIPS : MAX_NORMAL_SLIPPAGE_IN_BIPS
    if (parsedValue > maxSlippage) {
      const format = formatSlippage(maxSlippage)
      setTooltip(t`Max is ${format}`)
      e.preventDefault()
      return
    }

    setRawText(inputValue)
    onActiveChange(true)
    onChange(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    onFocusChange?.(false)
    const hasCustomText = rawText !== ''
    onActiveChange(hasCustomText || !options.includes(value))
    setRawText(getSlippageText(value, options, hasCustomText))
    trackingHandler(TRACKING_EVENT_TYPE.SLIPPAGE_CHANGED, {
      new_slippage: Number(formatSlippage(value, false)),
      previous_value: previousSlippageRef.current / 100,
      input_method: 'custom',
    })
    if (isCrossChain) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SLIPPAGE_CHANGED, {
        new_slippage: Number(formatSlippage(value, false)),
        previous_value: previousSlippageRef.current / 100,
        input_method: 'custom',
      })
    }
    previousSlippageRef.current = value
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setRawText(getSlippageText(value, options))
      setTooltip('')
    }
  }, [value, options])

  const shouldShowWarning = isWarning && rawText !== ''

  return (
    <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
      <div
        className={cn(
          'relative flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border px-2 text-sm',
          isHighlight && 'animate-highlight-warning',
          isActive
            ? cn(
                'bg-tabActive hover:bg-buttonGray',
                shouldShowWarning ? 'border-warning/50' : 'border-primary-50',
                rawText ? 'text-text' : 'text-subText',
              )
            : 'border-transparent bg-transparent text-subText hover:border-border hover:bg-buttonGray',
        )}
      >
        {isActive && shouldShowWarning && (
          <span role="img" aria-label="warning" className="absolute left-1.5 top-1 text-xs text-warning max-sm:hidden">
            ⚠️
          </span>
        )}
        <input
          ref={inputRef}
          placeholder={t`Custom`}
          value={rawText}
          onChange={handleChangeInput}
          onBlur={handleCommitChange}
          onFocus={() => {
            onFocusChange?.(true)
            onActiveChange(true)
          }}
          className="w-14 min-w-0 border-0 bg-transparent p-0 text-right text-[13px] font-medium text-inherit outline-none placeholder:text-inherit [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className={cn('text-sm', isActive && 'text-text')}>%</span>
      </div>
    </Tooltip>
  )
}

export default CustomSlippageInput
