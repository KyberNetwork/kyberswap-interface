import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import NumericalInput from 'components/NumericalInput'
import { RowBetween } from 'components/Row'
import DeltaRate from 'components/swapv2/LimitOrder/Form/DeltaRate'
import { RateInfo } from 'components/swapv2/LimitOrder/type'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { cn } from 'utils/cn'

const InputWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-1 flex-col gap-2 rounded-xl bg-buttonBlack p-3 max-sm:w-full', className)} {...rest}>
    {children}
  </div>
)

const Set2Market = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('m-0 cursor-pointer select-none text-xs font-medium text-primary', className)} {...rest}>
    {children}
  </div>
)

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  displayRate: string
  rateInfo: RateInfo
  tradeInfo: BaseTradeInfo | undefined
  onChangeRate: (value: string) => void
  onInvertRate: (invert: boolean) => void
  setPriceRateMarket: () => void
  trackingTouchInput: () => void
  trackingPriceSetOnBlur: () => void
}

export default function LimitOrderRateSection({
  currencyIn,
  currencyOut,
  displayRate,
  rateInfo,
  tradeInfo,
  onChangeRate,
  onInvertRate,
  setPriceRateMarket,
  trackingTouchInput,
  trackingPriceSetOnBlur,
}: Props) {
  return (
    <RowBetween className="flex-row gap-4 max-sm:flex-col">
      <InputWrapper>
        <div className="flex items-center justify-between">
          <DeltaRate
            invert={rateInfo.invert}
            symbol={(rateInfo.invert ? currencyOut?.symbol : currencyIn?.symbol) ?? ''}
            marketPrice={tradeInfo}
            rateInfo={rateInfo}
          />
          {tradeInfo && (
            <Set2Market onClick={setPriceRateMarket}>
              <Trans>Market</Trans>
            </Set2Market>
          )}
        </div>
        <div className="flex items-center rounded-xl bg-buttonBlack">
          <NumericalInput
            maxLength={50}
            className="h-7 text-sm"
            data-testid="input-selling-rate"
            value={displayRate}
            onUserInput={onChangeRate}
            onFocus={trackingTouchInput}
            onBlur={trackingPriceSetOnBlur}
          />
          {currencyIn && currencyOut && (
            <div className="flex cursor-pointer gap-1.5" onClick={() => onInvertRate(!rateInfo.invert)}>
              <CurrencyLogo size={'18px'} currency={rateInfo.invert ? currencyIn : currencyOut} />
              <span className="select-none text-sm text-subText">
                {rateInfo.invert ? currencyIn?.symbol : currencyOut?.symbol}
              </span>
              <div>
                <Repeat className="text-subText" size={12} />
              </div>
            </div>
          )}
        </div>
      </InputWrapper>
    </RowBetween>
  )
}
