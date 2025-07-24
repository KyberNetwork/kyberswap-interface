import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolRow, Tag } from 'pages/Earns/Landing/styles'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { EarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const PoolItem = ({ pool, isFarming }: { pool: EarnPool; isFarming?: boolean }) => {
  const theme = useTheme()
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
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
        <TokenLogo src={pool.tokens?.[0].logoURI} size={24} />
        <TokenLogo src={pool.tokens?.[1].logoURI} size={24} />
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
        <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
      </Flex>

      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text color={theme.primary}>
          {formatAprNumber((pool.apr || 0) + (pool.kemEGApr || 0) + (pool.kemLMApr || 0))}%
        </Text>
        {isFarming && (
          <MouseoverTooltipDesktopOnly
            placement="top"
            width="fit-content"
            text={
              <div>
                {t`LP Fee APR`}: {formatAprNumber(pool.apr || 0)}%
                <br />
                {t`EG Sharing Reward`}: {formatAprNumber(pool.kemEGApr || 0)}%
                <br />
                {t`LM Reward`}: {formatAprNumber(pool.kemLMApr || 0)}%
              </div>
            }
          >
            <IconFarmingPool width={20} height={20} />
          </MouseoverTooltipDesktopOnly>
        )}
      </Flex>
    </PoolRow>
  )
}

export default PoolItem
