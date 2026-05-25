import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'

import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

export default function ProAmmPriceRange({
  position,
  ticksAtLimit,
}: {
  position: Position
  ticksAtLimit: { [bound: string]: boolean | undefined }
}) {
  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  //   track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(currency0)

  const sorted = baseCurrency.symbol === currency0.symbol
  const quoteCurrency = sorted ? currency1 : currency0
  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  const baseSymbol = baseCurrency?.symbol
  const quoteSymbol = quoteCurrency?.symbol
  return (
    <OutlineCard className="mt-4 p-4">
      <AutoColumn className="gap-3">
        <div className="flex">
          <span className="text-xs font-medium text-subText">
            <Trans>Selected Price Range</Trans>
          </span>
          <InfoHelper
            text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees.`}
            placement={'right'}
            size={12}
          />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-subText">
              <Trans>Current Price</Trans>
            </span>
            <RowFixed>
              <span className="text-right text-xs font-medium">{`${price.toSignificant(6)} ${
                quoteCurrency.symbol
              } per ${baseCurrency.symbol}`}</span>
              <span onClick={handleRateChange} className="ml-0.5 cursor-pointer">
                <RotateSwapIcon rotated={baseCurrency !== currency0} size={14} />
              </span>
            </RowFixed>
          </div>
        </div>
        <RowBetween className="gap-3">
          <div className="flex">
            <span className="text-xs font-medium text-subText">
              <Trans>Min Price</Trans>
            </span>
            <InfoHelper
              text={t`Your position will be 100% composed of ${baseSymbol} at this price.`}
              placement={'right'}
              size={12}
            />
          </div>

          <span className="text-xs font-medium">
            <Trans>
              {formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)} {quoteCurrency.symbol} per {baseCurrency.symbol}
            </Trans>
          </span>
        </RowBetween>
        <RowBetween className="gap-3">
          <div className="flex">
            <span className="text-xs font-medium text-subText">
              <Trans>Max Price</Trans>
            </span>
            <InfoHelper
              text={t`Your position will be 100% composed of ${quoteSymbol} at this price.`}
              placement={'right'}
              size={12}
            />
          </div>

          <span className="text-xs font-medium">
            <Trans>
              {formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)} {quoteCurrency.symbol} per {baseCurrency.symbol}
            </Trans>
          </span>
        </RowBetween>
      </AutoColumn>
    </OutlineCard>
  )
}
