import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'
import { EarnPool } from 'pages/Earns/types'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import useLiquidityWidget from 'pages/Earns/useLiquidityWidget'
import { formatAprNumber } from 'pages/Earns/utils'
import { PoolRow, Tag } from 'pages/Earns/Landing/styles'

const PoolItem = ({ pool }: { pool: EarnPool }) => {
  const theme = useTheme()
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()

  return (
    <PoolRow
      justifyContent="space-between"
      key={pool.address}
      role="button"
      onClick={e => {
        e.stopPropagation()
        handleOpenZapInWidget({
          exchange: pool.exchange,
          chainId: pool.chainId,
          address: pool.address,
        })
      }}
    >
      {liquidityWidget}
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

      <Text color={theme.primary}>{formatAprNumber(pool.apr)}%</Text>
    </PoolRow>
  )
}

export default PoolItem
