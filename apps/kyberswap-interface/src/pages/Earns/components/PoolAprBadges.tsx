import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'

import { ReactComponent as KyberBonusIcon } from 'assets/svg/kyber/kyber_bonus.svg'
import { ReactComponent as UniBonusIcon } from 'assets/svg/kyber/uni_bonus.svg'
import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { Badge } from 'pages/Earns/PoolExplorer/styles'
import { EarnPool, ProgramType } from 'pages/Earns/types'

type Props = {
  pool: EarnPool
}

const PoolAprBadges = ({ pool }: Props) => {
  const showEgReward = pool.programs?.includes(ProgramType.EG) && pool.kemEGApr > 0
  const showLmReward = pool.programs?.includes(ProgramType.LM) && pool.kemLMApr > 0
  const merklOpportunity = pool.merklOpportunity

  if (!showEgReward && !showLmReward && !merklOpportunity) return null

  const tokenReward = merklOpportunity?.rewardsRecord.breakdowns[0]?.token

  return (
    <HStack className="flex-nowrap items-center gap-1">
      {showEgReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`FairFlow EG Rewards`}: ${formatAprNumber(pool.kemEGApr)}%`}
        >
          <Badge>
            <UniBonusIcon width={16} height={16} />
            <span>+{formatAprNumber(pool.kemEGApr)}%</span>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
      {showLmReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`LM Reward`}: ${formatAprNumber(pool.kemLMApr)}%`}
        >
          <Badge>
            <KyberBonusIcon width={16} height={16} />
            <span>+{formatAprNumber(pool.kemLMApr)}%</span>
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
