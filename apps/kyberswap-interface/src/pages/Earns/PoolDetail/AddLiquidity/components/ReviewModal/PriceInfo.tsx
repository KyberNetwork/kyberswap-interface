import { Pool } from '@kyber/schema'

import { HStack, Stack } from 'components/Stack'
import { CurrentPriceHeader } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/PriceInfo'
import { getPriceRangeToShow } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/utils'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { formatDisplayNumber } from 'utils/numbers'

type PriceInfoProps = {
  pool: Pool
  priceRange: ZapState['priceRange']
}

const PriceInfo = ({ pool, priceRange }: PriceInfoProps) => {
  const rangeToShow = getPriceRangeToShow({
    pool,
    revertPrice: priceRange.revertPrice,
    tickLower: priceRange.tickLower,
    tickUpper: priceRange.tickUpper,
    minPrice: priceRange.minPrice,
    maxPrice: priceRange.maxPrice,
  })

  return (
    <Stack className="gap-3 rounded-xl bg-buttonGray px-4 py-3">
      <CurrentPriceHeader
        pool={pool}
        poolPrice={priceRange.poolPrice}
        revertPrice={priceRange.revertPrice}
        formattedPrice={formatDisplayNumber(priceRange.poolPrice, { significantDigits: 8 })}
        onRevertPriceToggle={priceRange.toggleRevertPrice}
      />

      {rangeToShow && (
        <HStack className="gap-3">
          <HStack className="min-w-0 flex-1 items-stretch rounded-xl bg-tabActive">
            <Stack className="justify-center rounded-l-xl bg-darkText px-3 py-2">
              <span className="text-xs text-subText">MIN</span>
            </Stack>
            <HStack className="min-w-0 flex-1 justify-center px-3 py-2">
              <span
                className="min-w-0 max-w-full overflow-hidden truncate whitespace-nowrap font-medium"
                title={rangeToShow.minPrice?.toString()}
              >
                {rangeToShow.minPrice}
              </span>
            </HStack>
          </HStack>

          <HStack className="min-w-0 flex-1 items-stretch rounded-xl bg-tabActive">
            <Stack className="justify-center rounded-l-xl bg-darkText px-3 py-2">
              <span className="text-xs text-subText">MAX</span>
            </Stack>
            <HStack className="min-w-0 flex-1 justify-center px-3 py-2">
              <span
                className="min-w-0 max-w-full overflow-hidden truncate whitespace-nowrap font-medium"
                title={rangeToShow.maxPrice?.toString()}
              >
                {rangeToShow.maxPrice}
              </span>
            </HStack>
          </HStack>
        </HStack>
      )}
    </Stack>
  )
}

export default PriceInfo
