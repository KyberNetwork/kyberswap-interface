import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolRow, Tag } from 'pages/Earns/Landing/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { EarnPool, ProgramType } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const PoolItem = ({ pool }: { pool: EarnPool }) => {
  const theme = useTheme()
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
  })

  const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
  const isFarmingLm = pool.programs?.includes(ProgramType.LM)

  return (
    <PoolRow
      justifyContent="space-between"
      key={pool.address}
      role="button"
      onClick={e => {
        e.stopPropagation()
        handleOpenZapIn({
          pool: {
            dex: pool.exchange,
            chainId: pool.chainId as number,
            address: pool.address,
          },
        })
      }}
    >
      {zapInWidget}
      {zapMigrationWidget}
      <Flex alignItems="center" sx={{ gap: '4px', flex: 1 }}>
        <TokenLogo src={pool.tokens?.[0].logoURI} size={24} />
        <TokenLogo src={pool.tokens?.[1].logoURI} size={24} translateLeft />
        <TokenLogo
          src={NETWORKS_INFO[pool.chainId as ChainId].icon}
          size={12}
          translateLeft
          style={{ alignSelf: 'flex-end', position: 'relative', top: 1 }}
        />

        <Text
          textAlign="left"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pool.tokens?.[0].symbol} /{' '}
          <Text as="span" color={theme.subText}>
            {pool.tokens?.[1].symbol}
          </Text>
        </Text>
        <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
      </Flex>

      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text color={theme.primary}>
          {formatAprNumber((pool.apr || 0) + (pool.kemEGApr || 0) + (pool.kemLMApr || 0))}%
        </Text>
        {isFarming ? (
          <AprDetailTooltip feeApr={pool.apr || 0} egApr={pool.kemEGApr || 0} lmApr={pool.kemLMApr || 0}>
            {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
          </AprDetailTooltip>
        ) : null}
      </Flex>
    </PoolRow>
  )
}

export default PoolItem
