import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Text } from 'rebass'

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

  return (
    <HStack align="center" gap={4} wrap="nowrap">
      {showEgReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`FairFlow EG Rewards`}: ${formatAprNumber(egApr)}%`}
        >
          <Badge>
            <KyberBonusIcon width={16} height={16} />
            <Text>+{formatAprNumber(egApr)}%</Text>
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
            <KyberBonusIcon width={16} height={16} />
            <Text>+{formatAprNumber(lmApr)}%</Text>
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
            <Text>+{formatAprNumber(merklOpportunity.apr)}%</Text>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
    </HStack>
  )
}

export default PoolAprBadges
