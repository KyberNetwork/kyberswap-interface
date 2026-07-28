import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { LargePoolRow, ProtocolTag, SmallPoolRow, Tag } from 'pages/Earns/Landing/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import { EARN_DEXES } from 'pages/Earns/constants'
import { EarnPool, ProgramType } from 'pages/Earns/types'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type PoolItemVariant = 'small' | 'small-stable' | 'large' | 'large-farming'

const getFireEmoji = (apr: number) => {
  if (apr >= 10000) return '🔥🔥🔥 '
  if (apr >= 1000) return '🔥🔥 '
  return '🔥 '
}

const PoolItem = ({
  pool,
  variant = 'small',
  onClick,
}: {
  pool: EarnPool
  variant?: PoolItemVariant
  onClick: (pool: EarnPool) => void
}) => {
  const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
  const isFarmingLm = pool.programs?.includes(ProgramType.LM)
  const dexInfo = EARN_DEXES[pool.exchange]

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onClick(pool)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      handleClick(e)
    }
  }

  if (variant === 'large' || variant === 'large-farming') {
    return (
      <LargePoolRow
        variant={variant === 'large-farming' ? 'farming' : 'default'}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <TokenLogo src={pool.tokens?.[0]?.logoURI} size={24} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} size={24} translateLeft />
            <TokenLogo
              src={NETWORKS_INFO[pool.chainId as ChainId]?.icon}
              size={12}
              translateLeft
              className="relative top-px self-end"
            />

            <span className="ml-1 min-w-0 truncate text-base">
              {pool.tokens?.[0]?.symbol}
              <span className="text-subText">/{pool.tokens?.[1]?.symbol}</span>
            </span>
            <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
          </div>

          {dexInfo?.logo || dexInfo?.name ? (
            <ProtocolTag>
              {dexInfo.logo ? <img src={dexInfo.logo} alt={dexInfo.name} width={12} height={12} /> : null}
              <span>{dexInfo.name}</span>
            </ProtocolTag>
          ) : null}
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base text-subText">APR</span>
            <span className="text-lg font-semibold text-primary">{formatAprNumber(pool.allApr)}%</span>
            {isFarming ? (
              <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
                {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
              </AprDetailTooltip>
            ) : null}
          </div>
          {pool.egUsd ? (
            <div className="flex items-center gap-2">
              <span className="text-base text-subText">Rewards</span>
              <span className="text-base text-text">
                {formatDisplayNumber(pool.egUsd, { significantDigits: 4, style: 'currency' })}
              </span>
            </div>
          ) : null}
        </div>
      </LargePoolRow>
    )
  }

  const isStable = variant === 'small-stable'

  return (
    <SmallPoolRow
      variant={isStable ? 'stable' : 'default'}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <TokenLogo src={pool.tokens?.[0]?.logoURI} size={24} />
        <TokenLogo src={pool.tokens?.[1]?.logoURI} size={24} translateLeft />
        <TokenLogo
          src={NETWORKS_INFO[pool.chainId as ChainId]?.icon}
          size={12}
          translateLeft
          className="relative top-px self-end"
        />

        <span className="ml-1 min-w-0 truncate">
          {pool.tokens?.[0]?.symbol}
          <span className="text-subText">/{pool.tokens?.[1]?.symbol}</span>
        </span>
        <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
      </div>

      <div className="flex items-center gap-1">
        <span className={cn('text-base font-semibold', isStable ? 'text-blue3' : 'text-primary')}>
          {isStable ? '💎 ' : getFireEmoji(pool.allApr)}
          {formatAprNumber(pool.allApr)}%
        </span>
        {isFarming ? (
          <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
            {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
          </AprDetailTooltip>
        ) : null}
      </div>
    </SmallPoolRow>
  )
}

export default PoolItem
