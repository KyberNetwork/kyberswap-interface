import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Text } from 'rebass'

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

  return (
    <HStack align="center" gap={4} wrap="nowrap">
      {showEgReward && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${t`FairFlow EG Rewards`}: ${formatAprNumber(pool.kemEGApr)}%`}
        >
          <Badge>
            <UniBonusIcon width={16} height={16} />
            <Text>+{formatAprNumber(pool.kemEGApr)}%</Text>
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
            <Text>+{formatAprNumber(pool.kemLMApr)}%</Text>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
      {merklOpportunity && (
        <MouseoverTooltipDesktopOnly
          placement="bottom"
          width="fit-content"
          text={`${merklOpportunity.protocol.name} ${t`Bonus`}: ${formatAprNumber(merklOpportunity.apr)}%`}
        >
          <Badge>
            <TokenLogo src={merklOpportunity.protocol.icon} size={16} />
            <Text>+{formatAprNumber(merklOpportunity.apr)}%</Text>
          </Badge>
        </MouseoverTooltipDesktopOnly>
      )}
    </HStack>
  )
}

export default PoolAprBadges
