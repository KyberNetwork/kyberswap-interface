import { formatAprNumber } from '@kyber/utils/dist/number'
import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'
import { Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'
import { ExternalLink } from 'theme/components'

const AprTooltipContent = ({ pool, type }: { pool: ParsedEarnPool; type: 'total' | 'active' }) => {
  const theme = useTheme()
  const hasActiveApr = type === 'active'
  const lpApr = hasActiveApr ? pool.activeFeeApr : pool.lpApr
  const egApr = hasActiveApr ? pool.activeEgApr : pool.kemEGApr
  const lmApr = hasActiveApr ? pool.activeLmApr : pool.kemLMApr
  const bonusApr = pool.bonusApr

  return (
    <Stack gap={2}>
      {hasActiveApr ? (
        <Text>
          <Trans>
            Earning per{' '}
            <ExternalLink
              style={{ color: theme.primary }}
              href="https://docs.kyberswap.com/user-guide/kyber-earn/apr-metrics#active-apr"
            >
              Active TVL <Info size={12} style={{ marginBottom: -2 }} />
            </ExternalLink>
          </Trans>
        </Text>
      ) : (
        <Text>
          <Trans>
            Earning per{' '}
            <Text as="span" color={theme.blue}>
              Total TVL
            </Text>
          </Trans>
        </Text>
      )}
      {!!lpApr && (
        <Text>
          {t`LP Fee APR`}: {formatAprNumber(lpApr)}%
        </Text>
      )}
      {!!egApr && (
        <Text>
          {t`FairFlow EG Rewards`}: {formatAprNumber(egApr)}%
        </Text>
      )}
      {!!lmApr && (
        <Text>
          {t`LM Rewards`}: {formatAprNumber(lmApr)}%
        </Text>
      )}
      {!!bonusApr && (
        <Text>
          {t`Bonus APR`}: {formatAprNumber(bonusApr)}%
        </Text>
      )}
    </Stack>
  )
}

const FarmingMarker = ({ pool }: { pool: ParsedEarnPool }) => {
  const programs = pool.programs || []
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)
  const isFarmingLm = programs.includes(ProgramType.LM)

  if (!isFarming) return null

  return isFarmingLm ? (
    <FarmingLmIcon width={20} height={20} style={{ marginLeft: 4 }} />
  ) : (
    <FarmingIcon width={20} height={20} style={{ marginLeft: 4 }} />
  )
}

const PoolAprInfo = ({ pool }: { pool: ParsedEarnPool }) => {
  const theme = useTheme()

  return (
    <HStack align="center" gap={4} wrap="nowrap">
      {pool.activeApr ? (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="active" />}
        >
          <Text color={theme.primary}>{formatAprNumber(pool.activeApr + (pool.bonusApr || 0))}%</Text>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="total" />}
        >
          <Text color={theme.blue}>{formatAprNumber(pool.allApr)}%</Text>
        </MouseoverTooltipDesktopOnly>
      )}

      <FarmingMarker pool={pool} />
    </HStack>
  )
}

export default PoolAprInfo
