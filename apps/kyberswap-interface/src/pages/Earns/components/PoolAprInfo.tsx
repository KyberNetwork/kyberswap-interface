import { formatAprNumber } from '@kyber/utils/dist/number'
import { Trans, t } from '@lingui/macro'
import { Info } from 'react-feather'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import EgCalculating from 'pages/Earns/components/EgCalculating'
import EgCalculatingMarker from 'pages/Earns/components/EgCalculatingMarker'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'
import { excludeEg, hasEgProgram, isEgCalculating } from 'pages/Earns/utils/egCalculating'
import { ExternalLink } from 'theme/components'

const AprTooltipContent = ({
  pool,
  type,
  egCalculating,
}: {
  pool: ParsedEarnPool
  type: 'total' | 'active'
  egCalculating: boolean
}) => {
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
            <ExternalLink href="https://docs.kyberswap.com/user-guide/kyber-earn/apr-metrics#active-apr">
              Active TVL <Info className="inline align-text-bottom" size={12} />
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
      {(egCalculating || !!egApr) && (
        <p>
          {t`FairFlow EG Rewards`}: {egCalculating ? <EgCalculating /> : `${formatAprNumber(egApr ?? 0)}%`}
        </p>
      )}
      {!!lmApr && (
        <p>
          {t`LM Rewards`}: {formatAprNumber(lmApr)}%
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
    <FarmingLmIcon width={20} height={20} className="ml-1" />
  ) : (
    <FarmingIcon width={20} height={20} className="ml-1" />
  )
}

const PoolAprInfo = ({ pool }: { pool: ParsedEarnPool }) => {
  // The aggregates stay real by dropping the EG share; only the EG row itself reads as calculating.
  const egCalculating = isEgCalculating(pool.chain?.id ?? pool.chainId, hasEgProgram(pool.programs))
  const activeApr = egCalculating ? excludeEg(pool.activeApr, pool.activeEgApr) : pool.activeApr
  const allApr = egCalculating ? excludeEg(pool.allApr, pool.kemEGApr) : pool.allApr

  return (
    <HStack className="flex-nowrap items-center gap-1">
      {pool.activeApr ? (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="active" egCalculating={egCalculating} />}
        >
          <span className="whitespace-nowrap text-primary">
            {formatAprNumber((activeApr || 0) + (pool.bonusApr || 0))}%
            {egCalculating && <EgCalculatingMarker compact />}
          </span>
        </MouseoverTooltipDesktopOnly>
      ) : (
        <MouseoverTooltipDesktopOnly
          placement="left"
          width="fit-content"
          text={<AprTooltipContent pool={pool} type="total" egCalculating={egCalculating} />}
        >
          <span className="whitespace-nowrap text-blue">
            {formatAprNumber(allApr)}%{egCalculating && <EgCalculatingMarker compact />}
          </span>
        </MouseoverTooltipDesktopOnly>
      )}

      <FarmingMarker pool={pool} />
    </HStack>
  )
}

export default PoolAprInfo
