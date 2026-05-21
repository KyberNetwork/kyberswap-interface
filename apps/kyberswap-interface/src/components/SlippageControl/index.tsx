import React, { ButtonHTMLAttributes, forwardRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import CustomSlippageInput from 'components/SlippageControl/CustomSlippageInput'
import { APP_PATHS, DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { cn } from 'utils/cn'

import { Props as CustomSlippageInputProps } from './CustomSlippageInput'

const slippageOptionClasses =
  'h-full rounded-[20px] border border-transparent bg-tabBackground p-0 text-center text-xs font-normal leading-4 text-subText outline-none cursor-pointer hover:border-bg4 focus:border-bg4 data-[active=true]:border-primary data-[active=true]:bg-tabActive data-[active=true]:font-medium data-[active=true]:text-text data-[warning=true]:border-warning'

export const DefaultSlippageOption = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn(slippageOptionClasses, 'flex-1 max-[375px]:basis-[15%] max-[375px]:text-[10px]', className)}
    />
  ),
)
DefaultSlippageOption.displayName = 'DefaultSlippageOption'

type Props = CustomSlippageInputProps

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

  return (
    <div className="flex h-7 w-full max-w-full justify-between rounded-[20px] bg-tabBackground p-0.5">
      {options.map(slp => (
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
            setRawSlippage(slp)
          }}
          data-active={rawSlippage === slp}
          data-warning={rawSlippage === slp && isWarning}
        >
          {slp / 100}%
        </DefaultSlippageOption>
      ))}

      <CustomSlippageInput data-highlight={isHighlight} {...props} options={options} />
    </div>
  )
}

export default SlippageControl
