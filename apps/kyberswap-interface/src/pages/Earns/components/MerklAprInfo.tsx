import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { Badge } from 'pages/Earns/PoolExplorer/styles'
import { EarnPool } from 'pages/Earns/types'

type Props = {
  pool: EarnPool
}

export default function MerklAprInfo({ pool }: Props) {
  const merklOpportunity = pool.merklOpportunity
  if (!merklOpportunity) return null

  return (
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
  )
}
