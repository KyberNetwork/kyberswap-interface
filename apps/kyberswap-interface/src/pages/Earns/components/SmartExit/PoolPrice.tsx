import { Trans } from '@lingui/macro'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import InfoHelper from 'components/InfoHelper'
import { RevertIconWrapper } from 'pages/Earns/PositionDetail/styles'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import { PositionValueWrapper } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { CustomBox, Divider } from 'pages/Earns/components/SmartExit/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

interface PoolPriceProps {
  position: ParsedPosition | null
  isLoading?: boolean
  revertPrice: boolean
  setRevertPrice: (value: boolean) => void
}

export default function PoolPrice({ position, isLoading = false, revertPrice, setRevertPrice }: PoolPriceProps) {
  if (isLoading || !position) {
    return (
      <CustomBox>
        <div className="mb-4 flex flex-wrap items-center gap-1">
          <span className="text-sm text-subText">
            <Trans>Current Price</Trans>
          </span>
          <PositionSkeleton width={150} height={20} />
          <PositionSkeleton width={20} height={20} style={{ borderRadius: '50%' }} />
        </div>

        <div className="mb-6 mt-2">
          <PositionValueWrapper align="center">
            <PositionSkeleton width="100%" height={60} />
          </PositionValueWrapper>
        </div>

        <Divider />

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm text-subText">
            <Trans>Earning Fee Yield</Trans>
          </span>
          <PositionSkeleton width={50} height={20} />
        </div>
      </CustomBox>
    )
  }

  return (
    <CustomBox>
      <div className="mb-4 flex flex-wrap items-center gap-1">
        <span className="text-sm text-subText">
          <Trans>Current Price</Trans>
        </span>
        <span>
          1 {revertPrice ? position.token1.symbol : position.token0.symbol} ={' '}
          {formatDisplayNumber(revertPrice ? 1 / position.priceRange.current : position.priceRange.current, {
            significantDigits: 6,
          })}{' '}
          {revertPrice ? position.token0.symbol : position.token1.symbol}
        </span>
        <RevertIconWrapper onClick={() => setRevertPrice(!revertPrice)}>
          <RevertPriceIcon width={12} height={12} />
        </RevertIconWrapper>
      </div>

      <div className="mb-6 mt-2">
        <PositionValueWrapper align="center">
          <PriceRange
            minPrice={position.priceRange.min}
            maxPrice={position.priceRange.max}
            currentPrice={position.priceRange.current}
            tickSpacing={position.pool.tickSpacing}
            token0Decimals={position.token0.decimals}
            token1Decimals={position.token1.decimals}
            dex={position.dex.id}
            invertPrice={revertPrice}
          />
        </PositionValueWrapper>
      </div>

      <Divider />

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm text-subText">
          <Trans>Earning Fee Yield</Trans>{' '}
          <InfoHelper
            text={
              <span>
                <Trans>
                  Your position’s % earned fees so far, based on the amount of fee tokens earned compared with your
                  initial deposit.
                </Trans>
                <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/smart-exit/feature-capabilities#id-1.-fee-yield-condition">
                  <span className="ml-1">
                    <Trans>Details</Trans>
                  </span>
                </ExternalLink>
              </span>
            }
          />{' '}
        </span>
        <span>{formatDisplayNumber(position.earningFeeYield, { significantDigits: 4 })}%</span>
      </div>
    </CustomBox>
  )
}
