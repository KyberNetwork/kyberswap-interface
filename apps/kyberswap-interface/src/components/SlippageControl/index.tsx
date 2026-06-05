import React, { ButtonHTMLAttributes, forwardRef, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import CustomSlippageInput from 'components/SlippageControl/CustomSlippageInput'
import { APP_PATHS, DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { cn } from 'utils/cn'

export const DefaultSlippageOption = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn('h-7 min-w-0 flex-1 cursor-pointer rounded-full border px-2 text-sm', className)}
    />
  ),
)
DefaultSlippageOption.displayName = 'DefaultSlippageOption'

type Props = {
  rawSlippage: number
  setRawSlippage: (value: number) => void
  isWarning: boolean
  isHighlight?: boolean
  options: number[]
}

const SlippageControl: React.FC<Props> = props => {
  const { rawSlippage, setRawSlippage, isWarning, isHighlight } = props
  const { trackingHandler } = useTracking()
  const { pathname } = useLocation()
  const isCrossChain = pathname.startsWith(APP_PATHS.CROSS_CHAIN)
  const cat = usePairCategory()
  const options = useMemo(
    () =>
      props.options?.length
        ? props.options
        : cat === 'highVolatilityPair'
        ? DEFAULT_SLIPPAGES_HIGH_VOTALITY
        : DEFAULT_SLIPPAGES,
    [cat, props.options],
  )
  const [isCustomActive, setIsCustomActive] = useState(!options.includes(rawSlippage))
  const [isCustomInputFocused, setIsCustomInputFocused] = useState(false)

  useEffect(() => {
    if (isCustomInputFocused) return
    setIsCustomActive(!options.includes(rawSlippage))
  }, [isCustomInputFocused, options, rawSlippage])

  return (
    <div className="flex w-full max-w-full items-stretch rounded-[20px] bg-tabBackground">
      {options.map(slp => {
        const isActive = rawSlippage === slp && !isCustomActive

        return (
          <DefaultSlippageOption
            key={slp}
            onClick={() => {
              trackingHandler(TRACKING_EVENT_TYPE.SLIPPAGE_CHANGED, {
                new_slippage: slp / 100,
                previous_value: rawSlippage / 100,
                input_method: 'preset',
              })
              if (isCrossChain) {
                trackingHandler(TRACKING_EVENT_TYPE.CC_SLIPPAGE_CHANGED, {
                  new_slippage: slp / 100,
                  previous_value: rawSlippage / 100,
                  input_method: 'preset',
                })
              }
              setIsCustomActive(false)
              setRawSlippage(slp)
            }}
            className={cn(
              isActive
                ? cn(
                    'bg-tabActive text-text hover:bg-buttonGray',
                    isWarning ? 'border-warning/50' : 'border-primary-50',
                  )
                : 'border-transparent bg-transparent text-subText hover:border-border hover:bg-buttonGray',
            )}
          >
            {slp / 100}%
          </DefaultSlippageOption>
        )
      })}

      <CustomSlippageInput
        value={rawSlippage}
        isActive={isCustomActive}
        onActiveChange={setIsCustomActive}
        onFocusChange={setIsCustomInputFocused}
        onChange={setRawSlippage}
        isWarning={isWarning}
        isHighlight={isHighlight}
        options={options}
      />
    </div>
  )
}

export default SlippageControl
