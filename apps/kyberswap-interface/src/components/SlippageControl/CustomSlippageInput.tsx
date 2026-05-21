import { t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import Tooltip from 'components/Tooltip'
import { APP_PATHS, MAX_DEGEN_SLIPPAGE_IN_BIPS, MAX_NORMAL_SLIPPAGE_IN_BIPS } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDefaultSlippageByPair } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { cn } from 'utils/cn'
import { formatSlippage } from 'utils/slippage'

const parseSlippageInput = (str: string): number => Math.round(Number.parseFloat(str) * 100)
const getSlippageText = (rawSlippage: number, options: number[]) => {
  const isCustom = !options.includes(rawSlippage)
  if (!isCustom) {
    return ''
  }

  return formatSlippage(rawSlippage, false)
}

const customSlippageOptionClasses =
  'group inline-flex h-full flex-1 cursor-pointer items-center gap-0.5 rounded-[20px] border border-transparent bg-tabBackground px-1 text-center text-xs font-normal leading-4 text-subText outline-none transition-all duration-150 ease-linear hover:border-bg4 focus:border-bg4 data-[active=true]:font-medium data-[active=true]:text-text data-[warning=true]:border-warning data-[highlight=true]:animate-highlight-warning'

export type Props = {
  rawSlippage: number
  setRawSlippage: (value: number) => void
  isWarning: boolean
  isHighlight?: boolean
  options: number[]
}

const CustomSlippageInput: React.FC<Props> = ({ options, rawSlippage, setRawSlippage, isWarning, isHighlight }) => {
  const [tooltip, setTooltip] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const previousSlippageRef = useRef(rawSlippage)
  const { trackingHandler } = useTracking()
  const { pathname } = useLocation()
  const isCrossChain = pathname.startsWith(APP_PATHS.CROSS_CHAIN)
  const [isDegenMode] = useDegenModeManager()

  const defaultRawSlippage = useDefaultSlippageByPair()

  const [rawText, setRawText] = useState(getSlippageText(rawSlippage, options))

  const isCustomOptionActive = !options.includes(rawSlippage)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTooltip('')
    const value = e.target.value

    if (value === '') {
      setRawText(value)
      setRawSlippage(defaultRawSlippage)
      return
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/
    if (!value.match(numberRegex)) {
      e.preventDefault()
      return
    }

    const parsedValue = parseSlippageInput(value)
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

    setRawText(value)
    setRawSlippage(parsedValue)
  }

  const handleCommitChange = () => {
    setTooltip('')
    setRawText(getSlippageText(rawSlippage, options))
    trackingHandler(TRACKING_EVENT_TYPE.SLIPPAGE_CHANGED, {
      new_slippage: Number(formatSlippage(rawSlippage, false)),
      previous_value: previousSlippageRef.current / 100,
      input_method: 'custom',
    })
    if (isCrossChain) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_SLIPPAGE_CHANGED, {
        new_slippage: Number(formatSlippage(rawSlippage, false)),
        previous_value: previousSlippageRef.current / 100,
        input_method: 'custom',
      })
    }
    previousSlippageRef.current = rawSlippage
  }

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setRawText(getSlippageText(rawSlippage, options))
      setTooltip('')
    }
  }, [rawSlippage, options])

  return (
    <div className="flex flex-1">
      <Tooltip text={tooltip} show={!!tooltip} placement="bottom" width="fit-content">
        <div
          data-active={isCustomOptionActive}
          data-warning={isCustomOptionActive && isWarning}
          data-highlight={isHighlight}
          className={customSlippageOptionClasses}
        >
          {isCustomOptionActive && isWarning && (
            <span className="basis-3 group-data-[warning=true]:text-warning max-sm:hidden">
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            </span>
          )}
          <input
            ref={inputRef}
            placeholder={t`Custom`}
            value={rawText}
            onChange={handleChangeInput}
            onBlur={handleCommitChange}
            className={cn(
              'size-full rounded-[inherit] border-0 bg-transparent text-right text-inherit outline-none placeholder:text-xs max-[375px]:text-[10px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            )}
          />
          <span className="basis-3">%</span>
        </div>
      </Tooltip>
    </div>
  )
}

export default CustomSlippageInput
