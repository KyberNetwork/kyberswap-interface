import { Trans } from '@lingui/macro'

import TokenLogo from 'components/TokenLogo'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { CustomBox } from 'pages/Earns/components/SmartExit/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

interface PositionLiquidityProps {
  position: ParsedPosition | null
  isLoading?: boolean
}

export default function PositionLiquidity({ position, isLoading = false }: PositionLiquidityProps) {
  if (isLoading || !position) {
    return (
      <CustomBox>
        <div className="flex items-center justify-between">
          <span className="text-sm text-subText">
            <Trans>Your Position Liquidity</Trans>
          </span>
          <PositionSkeleton width={80} height={20} />
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1">
            <PositionSkeleton width={16} height={16} style={{ borderRadius: '50%' }} />
            <PositionSkeleton width={40} height={16} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <PositionSkeleton width={60} height={16} />
            <PositionSkeleton width={50} height={12} />
          </div>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1">
            <PositionSkeleton width={16} height={16} style={{ borderRadius: '50%' }} />
            <PositionSkeleton width={40} height={16} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <PositionSkeleton width={60} height={16} />
            <PositionSkeleton width={50} height={12} />
          </div>
        </div>
      </CustomBox>
    )
  }

  return (
    <CustomBox>
      <div className="flex items-center justify-between">
        <span className="text-sm text-subText">
          <Trans>Your Position Liquidity</Trans>
        </span>
        <span>{formatDisplayNumber(position.totalValue, { style: 'currency', significantDigits: 4 })}</span>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1">
          <TokenLogo src={position.token0.logo} size={16} />
          {position.token0.symbol}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span>{formatDisplayNumber(position.token0.currentAmount, { significantDigits: 6 })}</span>
          <span className="text-xs text-subText">
            {formatDisplayNumber(position.token0.price * position.token0.currentAmount, {
              style: 'currency',
              significantDigits: 6,
            })}
          </span>
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1">
          <TokenLogo src={position.token1.logo} size={16} />
          {position.token1.symbol}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span>{formatDisplayNumber(position.token1.currentAmount, { significantDigits: 6 })}</span>
          <span className="text-xs text-subText">
            {formatDisplayNumber(position.token1.price * position.token1.currentAmount, {
              style: 'currency',
              significantDigits: 6,
            })}
          </span>
        </div>
      </div>
    </CustomBox>
  )
}
