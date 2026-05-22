import { Pool } from '@kyber/schema'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import { getDisplayedPriceTokens } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/utils'
import { formatDisplayNumber } from 'utils/numbers'

interface PriceInfoProps {
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  onRevertPriceToggle?: () => void
}

export const CurrentPriceHeader = ({
  pool,
  poolPrice,
  revertPrice,
  formattedPrice,
  onRevertPriceToggle,
}: {
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  formattedPrice: string
  onRevertPriceToggle?: () => void
}) => {
  const { baseToken, quoteToken } = getDisplayedPriceTokens(pool, revertPrice)

  return (
    <HStack align="center" justify="space-between" gap={12}>
      <HStack flex="1 1 auto" align="center" gap={8} wrap="wrap">
        <span className="text-sm text-subText">Current Price</span>
        <HStack gap={4} wrap="wrap" className="flex-wrap text-sm text-text">
          <span>1</span>
          <span>{baseToken.symbol}</span>
          <span>=</span>
          <span>{formattedPrice}</span>
          <span>{quoteToken.symbol}</span>
        </HStack>
      </HStack>

      <button
        aria-label="Reverse price"
        disabled={poolPrice === null}
        onClick={onRevertPriceToggle}
        type="button"
        className="flex size-6 shrink-0 grow-0 cursor-pointer items-center justify-center rounded-full border-0 bg-tabActive text-subText hover:brightness-110"
      >
        <RevertPriceIcon width={12} height={12} />
      </button>
    </HStack>
  )
}

const PriceInfo = ({ pool, poolPrice, revertPrice, onRevertPriceToggle }: PriceInfoProps) => {
  return (
    <Stack gap={8} className="rounded-xl border border-solid border-border px-3 py-2">
      <CurrentPriceHeader
        pool={pool}
        poolPrice={poolPrice}
        revertPrice={revertPrice}
        formattedPrice={formatDisplayNumber(poolPrice, { significantDigits: 8 })}
        onRevertPriceToggle={onRevertPriceToggle}
      />

      {poolPrice === null && (
        <Stack className="rounded-lg bg-warning-10 px-3 py-2">
          <span className="text-xs italic text-text">Unable to get the market price. Please be cautious.</span>
        </Stack>
      )}
    </Stack>
  )
}

export default PriceInfo
