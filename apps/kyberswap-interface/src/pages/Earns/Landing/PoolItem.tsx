import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolRow, Tag } from 'pages/Earns/Landing/styles'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { EarnPool } from 'pages/Earns/types'
import { formatAprNumber } from 'pages/Earns/utils'

const PoolItem = ({ pool, isFarming }: { pool: EarnPool; isFarming?: boolean }) => {
  const theme = useTheme()
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
  })

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
        <img src={pool.tokens?.[0].logoURI} width={24} height={24} alt="" style={{ borderRadius: '50%' }} />
        <img
          src={pool.tokens?.[1].logoURI}
          width={24}
          height={24}
          alt=""
          style={{ marginLeft: '-8px', borderRadius: '50%' }}
        />
        <img
          src={NETWORKS_INFO[pool.chainId as ChainId].icon}
          width={12}
          height={12}
          alt=""
          style={{ marginLeft: '-4px', alignSelf: 'flex-end' }}
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
        <Tag>{pool.feeTier}%</Tag>
      </Flex>

      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text color={theme.primary}>{formatAprNumber(pool.apr)}%</Text>
        {isFarming && <IconFarmingPool width={20} height={20} />}
      </Flex>
    </PoolRow>
  )
}

export default PoolItem
