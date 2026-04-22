import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { LargePoolRow, ProtocolTag, SmallPoolRow, Tag } from 'pages/Earns/Landing/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import { EARN_DEXES } from 'pages/Earns/constants'
import { EarnPool, ProgramType } from 'pages/Earns/types'
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
  const theme = useTheme()

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
        <Flex alignItems="center" flexWrap="wrap" sx={{ gap: '8px', width: '100%' }}>
          <Flex alignItems="center" sx={{ gap: '4px', flex: 1, minWidth: 0 }}>
            <TokenLogo src={pool.tokens?.[0]?.logoURI} size={24} />
            <TokenLogo src={pool.tokens?.[1]?.logoURI} size={24} translateLeft />
            <TokenLogo
              src={NETWORKS_INFO[pool.chainId as ChainId]?.icon}
              size={12}
              translateLeft
              style={{ alignSelf: 'flex-end', position: 'relative', top: 1 }}
            />

            <Text
              marginLeft="4px"
              fontSize={16}
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {pool.tokens?.[0]?.symbol}
              <Text as="span" color={theme.subText}>
                /{pool.tokens?.[1]?.symbol}
              </Text>
            </Text>
            <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
          </Flex>

          {dexInfo?.logo || dexInfo?.name ? (
            <ProtocolTag>
              {dexInfo.logo ? <img src={dexInfo.logo} alt={dexInfo.name} width={12} height={12} /> : null}
              <span>{dexInfo.name}</span>
            </ProtocolTag>
          ) : null}
        </Flex>

        <Flex alignItems="center" justifyContent="space-between" width="100%">
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            <Text fontSize={16} color={theme.subText}>
              APR
            </Text>
            <Text fontSize={18} color={theme.primary} fontWeight={600}>
              {formatAprNumber(pool.allApr)}%
            </Text>
            {isFarming ? (
              <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
                {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
              </AprDetailTooltip>
            ) : null}
          </Flex>
          {pool.egUsd ? (
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <Text fontSize={16} color={theme.subText}>
                Rewards
              </Text>
              <Text fontSize={16} color={theme.text}>
                {formatDisplayNumber(pool.egUsd, { significantDigits: 4, style: 'currency' })}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </LargePoolRow>
    )
  }

  return (
    <SmallPoolRow
      variant={variant === 'small-stable' ? 'stable' : 'default'}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Flex alignItems="center" sx={{ gap: '4px', flex: 1, minWidth: 0 }}>
        <TokenLogo src={pool.tokens?.[0]?.logoURI} size={24} />
        <TokenLogo src={pool.tokens?.[1]?.logoURI} size={24} translateLeft />
        <TokenLogo
          src={NETWORKS_INFO[pool.chainId as ChainId]?.icon}
          size={12}
          translateLeft
          style={{ alignSelf: 'flex-end', position: 'relative', top: 1 }}
        />

        <Text
          marginLeft="4px"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pool.tokens?.[0]?.symbol}
          <Text as="span" color={theme.subText}>
            /{pool.tokens?.[1]?.symbol}
          </Text>
        </Text>
        <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
      </Flex>

      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text color={variant === 'small-stable' ? theme.blue3 : theme.primary} fontSize={16} fontWeight={600}>
          {variant === 'small-stable' ? '💎 ' : getFireEmoji(pool.allApr)}
          {formatAprNumber(pool.allApr)}%
        </Text>
        {isFarming ? (
          <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
            {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
          </AprDetailTooltip>
        ) : null}
      </Flex>
    </SmallPoolRow>
  )
}

export default PoolItem
