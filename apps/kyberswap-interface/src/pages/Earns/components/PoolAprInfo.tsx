import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Apr } from 'pages/Earns/PoolExplorer/styles'
import { ParsedEarnPool, ProgramType } from 'pages/Earns/types'

const getAprColor = (value: number, positiveColor: string, zeroColor: string, negativeColor: string) => {
  if (value > 0) return positiveColor
  if (value < 0) return negativeColor
  return zeroColor
}

const getActiveAllApr = (pool: ParsedEarnPool) => {
  if (pool.activeAllApr !== undefined) return pool.activeAllApr

  const hasActiveBreakdown =
    pool.activeLpApr !== undefined || pool.activeKemEGApr !== undefined || pool.activeKemLMApr !== undefined

  if (!hasActiveBreakdown) return undefined

  return (
    Number(pool.activeLpApr || 0) +
    Number(pool.activeKemEGApr || 0) +
    Number(pool.activeKemLMApr || 0) +
    Number(pool.bonusApr ?? 0)
  )
}

const AprTooltipContent = ({ pool, type }: { pool: ParsedEarnPool; type: 'total' | 'active' }) => {
  const theme = useTheme()
  const isActive = type === 'active'
  const lpApr = isActive ? pool.activeLpApr : pool.lpApr
  const egApr = isActive ? pool.activeKemEGApr : pool.kemEGApr
  const lmApr = isActive ? pool.activeKemLMApr : pool.kemLMApr
  const bonusApr = pool.bonusApr

  return (
    <Stack gap={2}>
      <Text>
        {t`Earning per`}{' '}
        <Text as="span" color={isActive ? theme.blue : theme.primary}>
          {isActive ? t`Active` : t`Total`}
        </Text>{' '}
        {t`TVL`}
      </Text>
      {lpApr !== undefined && (
        <Text>
          {t`LP Fee APR`}: {formatAprNumber(lpApr)}%
        </Text>
      )}
      {egApr !== undefined && (
        <Text>
          {t`FairFlow EG Rewards`}: {formatAprNumber(egApr)}%
        </Text>
      )}
      {lmApr !== undefined && (
        <Text>
          {t`LM Reward`}: {formatAprNumber(lmApr)}%
        </Text>
      )}
      {bonusApr !== undefined && (
        <Text>
          {t`Uniswap Bonus`}: {formatAprNumber(bonusApr)}%
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
    <FarmingLmIcon width={24} height={24} style={{ marginLeft: 4 }} />
  ) : (
    <FarmingIcon width={24} height={24} style={{ marginLeft: 4 }} />
  )
}

const PoolAprInfo = ({ pool }: { pool: ParsedEarnPool }) => {
  const theme = useTheme()
  const activeAllApr = getActiveAllApr(pool)

  return (
    <HStack align="center" gap={4} wrap="wrap">
      <MouseoverTooltipDesktopOnly
        placement="bottom"
        width="fit-content"
        text={<AprTooltipContent pool={pool} type="total" />}
      >
        <Apr value={pool.allApr}>{formatAprNumber(pool.allApr)}%</Apr>
      </MouseoverTooltipDesktopOnly>

      {activeAllApr !== undefined ? (
        <>
          <Text color={theme.subText}>|</Text>
          <MouseoverTooltipDesktopOnly
            placement="bottom"
            width="fit-content"
            text={<AprTooltipContent pool={pool} type="active" />}
          >
            <Text color={getAprColor(activeAllApr, theme.blue, theme.blue, theme.red)} fontWeight={500}>
              {formatAprNumber(activeAllApr)}%
            </Text>
          </MouseoverTooltipDesktopOnly>
        </>
      ) : null}

      <FarmingMarker pool={pool} />
    </HStack>
  )
}

export default PoolAprInfo
