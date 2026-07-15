import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'

import { ReactComponent as KyberBonusIcon } from 'assets/svg/kyber/kyber_bonus.svg'
import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { Badge } from 'pages/Earns/PoolExplorer/styles'
import { EarnPool, ProgramType } from 'pages/Earns/types'

type Props = {
  pool: EarnPool
}

const PoolAprBadges = ({ pool }: Props) => {
  const hasActiveApr = !!pool.activeApr
  const egApr = hasActiveApr ? pool.activeEgApr || 0 : pool.kemEGApr
  const lmApr = hasActiveApr ? pool.activeLmApr || 0 : pool.kemLMApr
  const showEgReward = pool.programs?.includes(ProgramType.EG) && egApr > 0
  const showLmReward = pool.programs?.includes(ProgramType.LM) && lmApr > 0
  const merklOpportunity = pool.merklOpportunity

  if (!showEgReward && !showLmReward && !merklOpportunity) return null

  const tokenReward = merklOpportunity?.rewardsRecord.breakdowns[0]?.token
  const lmRewardLogos = (pool.kemReward?.rewardCfg ?? [])
    .map(reward => reward.tokenInfo?.logoURL)
    .filter((logo): logo is string => !!logo)

  return (
    <HStack className="flex-nowrap items-center gap-1">
      {showEgReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`FairFlow EG Rewards`}: ${formatAprNumber(egApr)}%`}
        >
          <Badge>
            <KyberBonusIcon width={16} height={16} />
            <span>+{formatAprNumber(egApr)}%</span>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
      {showLmReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`LM Rewards`}: ${formatAprNumber(lmApr)}%`}
        >
          <Badge>
            {lmRewardLogos.length > 0 ? (
              <HStack className="flex-nowrap items-center gap-0.5">
                {lmRewardLogos.map((logo, index) => (
                  <TokenLogo key={`${logo}-${index}`} src={logo} size={16} className="min-w-4 shrink-0" />
                ))}
              </HStack>
            ) : (
              <KyberBonusIcon width={16} height={16} />
            )}
            <span>+{formatAprNumber(lmApr)}%</span>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
      {tokenReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`Merkl Bonus: ${formatAprNumber(merklOpportunity.apr)}%`}
        >
          <Badge>
            <TokenLogo src={tokenReward.icon} size={16} />
            <span>+{formatAprNumber(merklOpportunity.apr)}%</span>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
    </HStack>
  )
}

export default PoolAprBadges
