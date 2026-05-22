import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'

import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { FarmTag } from 'components/FarmTag'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { FeeTag } from 'pages/ElasticLegacy/PositionLegacy'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { RotateSwapIcon } from './styles'

export default function ProAmmPoolInfo({
  isFarmActive,
  isFarmV2Active,
  position,
  tokenId,
  narrow = false,
  rotatedProp,
  setRotatedProp,
  showRangeInfo = true,
  showRemoved = true,
}: {
  isFarmActive?: boolean
  isFarmV2Active?: boolean
  position: Position
  tokenId?: string
  narrow?: boolean
  rotatedProp?: boolean
  setRotatedProp?: (rotated: boolean) => void
  showRangeInfo?: boolean
  showRemoved?: boolean
}) {
  const { chainId } = useActiveWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const poolAddress = useProAmmPoolInfo(position.pool.token0, position.pool.token1, position.pool.fee as FeeAmount)

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange = position.pool.tickCurrent < position.tickLower || position.pool.tickCurrent >= position.tickUpper

  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)

  const renderFarmIcon = () => {
    if (!isFarmActive && !isFarmV2Active) {
      return null
    }

    return (
      <div className="flex items-center gap-1">
        <FarmTag address={poolAddress} />
      </div>
    )
  }

  const [rotatedState, setRotatedState] = useState(false)
  const [rotated, setRotated] =
    typeof rotatedProp === 'boolean' && typeof setRotatedProp !== 'undefined'
      ? [rotatedProp, setRotatedProp]
      : [rotatedState, setRotatedState]
  const [tokenA, tokenB] = rotated ? [position.amount0, position.amount1] : [position.amount1, position.amount0]

  const onReversePrice: React.MouseEventHandler<HTMLSpanElement> = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      setRotated(!rotated)
    },
    [rotated, setRotated],
  )

  return (
    <>
      {poolAddress && (
        <AutoColumn>
          <div className={cn('flex justify-between gap-2', upToSmall ? '' : 'items-center')}>
            <div className="flex flex-1 items-center">
              <DoubleCurrencyLogo currency0={token0Shown} currency1={token1Shown} size={20} />
              <span className="max-w-fit flex-1 truncate text-base font-medium">
                {token0Shown.symbol} - {token1Shown.symbol}
              </span>
              <FeeTag>FEE {(position?.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}% </FeeTag>
            </div>

            <div className="flex gap-2">
              {renderFarmIcon()}
              {showRangeInfo && <RangeBadge removed={showRemoved && removed} inRange={!outOfRange} hideText />}
            </div>
          </div>

          <div className={cn('mt-2 flex justify-between gap-2', upToExtraSmall ? 'items-start' : 'items-center')}>
            <div className="flex items-center text-xs text-subText">
              <Copy
                toCopy={poolAddress}
                text={<span className="text-xs font-medium text-subText">{shortenAddress(chainId, poolAddress)} </span>}
              />
            </div>
            {showRangeInfo && !!tokenId ? <span className="mr-1 text-xs text-subText">#{tokenId}</span> : null}
            {narrow && (
              <div className="flex gap-1">
                <span className="text-xs">
                  <span className="flex">
                    <span className="text-subText">
                      <Trans>Current Price:</Trans>
                    </span>
                    &nbsp;1 {tokenB.currency.symbol} = {position.pool.priceOf(tokenB.currency).toSignificant(10)}{' '}
                    {tokenA.currency.symbol}
                  </span>
                </span>
                <span onClick={onReversePrice} className="cursor-pointer">
                  <RotateSwapIcon rotated={rotated} size={12} />
                </span>
              </div>
            )}
          </div>
        </AutoColumn>
      )}
    </>
  )
}
