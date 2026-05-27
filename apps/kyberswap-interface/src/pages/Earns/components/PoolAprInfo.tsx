import { formatAprNumber } from '@kyber/utils/dist/number'
import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'

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
    <Stack className="gap-0.5">
      {hasActiveApr ? (
        <p>
          <Trans>
            Earning per{' '}
            <ExternalLink
              style={{ color: theme.primary }}
              href="https://docs.kyberswap.com/user-guide/kyber-earn/apr-metrics#active-apr"
            >
              Active TVL <Info size={12} style={{ marginBottom: -2 }} />
            </ExternalLink>
          </Trans>
        </p>
      ) : (
        <p>
          <Trans>
            Earning per <span className="text-blue">Total TVL</span>
          </Trans>
        </p>
      )}
      {!!lpApr && (
        <p>
          {t`LP Fee APR`}: {formatAprNumber(lpApr)}%
        </p>
      )}
      {!!egApr && (
        <p>
          {t`FairFlow EG Rewards`}: {formatAprNumber(egApr)}%
        </p>
      )}
      {!!lmApr && (
        <p>
          {t`LM Reward`}: {formatAprNumber(lmApr)}%
        </p>
      )}
      {!!bonusApr && (
        <p>
          {t`Bonus APR`}: {formatAprNumber(bonusApr)}%
        </p>
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
    <FarmingLmIcon width={24} height={24} className="ml-1" />
  ) : (
    <FarmingIcon width={20} height={20} className="ml-1" />
  )
}

const PoolAprInfo = ({ pool }: { pool: ParsedEarnPool }) => {
  return (
    <HStack className="flex-nowrap items-center gap-1">
      {pool.activeApr ? (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="active" />}
        >
          <span className="text-primary">{formatAprNumber(pool.activeApr + (pool.bonusApr || 0))}%</span>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="total" />}
        >
          <span className="text-blue">{formatAprNumber(pool.allApr)}%</span>
        </MouseoverTooltipDesktopOnly>
      )}

      <FarmingMarker pool={pool} />
    </HStack>
  )
}

export default PoolAprInfo
