import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { PropsWithChildren, useMemo } from 'react'
import { Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { MerklOpportunity } from 'pages/Earns/types'

type Props = PropsWithChildren<{
  egApr?: number
  lmApr?: number
  dexLogo?: string
  dexName?: string
  merklOpportunity?: MerklOpportunity
}>

export default function PositionAprTooltip({ egApr, lmApr, dexLogo, dexName, merklOpportunity, children }: Props) {
  const theme = useTheme()

  const campaignRows = useMemo(() => {
    if (!merklOpportunity?.campaigns.length) return []

    return merklOpportunity.campaigns.map(campaign => {
      const reward = merklOpportunity.rewardsRecord.breakdowns.find(item => item.campaignId === campaign.id)
      const chainInfo = reward?.token.chainId ? NETWORKS_INFO[reward.token.chainId as ChainId] : undefined

      return {
        id: campaign.id,
        name: merklOpportunity.protocol.name,
        icon: merklOpportunity.protocol.icon || chainInfo?.icon,
        apr: campaign.apr,
      }
    })
  }, [merklOpportunity])

  const hasContent = !!egApr || !!lmApr || campaignRows.length > 0

  if (!hasContent) return <>{children}</>

  return (
    <MouseoverTooltipDesktopOnly
      placement="top"
      width="fit-content"
      text={
        <Flex flexDirection="column" sx={{ gap: '8px' }}>
          {!!egApr && (
            <Flex alignItems="center" sx={{ gap: '4px' }}>
              <TokenLogo src={dexLogo} size={16} />
              <Text fontSize={12} color={theme.subText}>
                {dexName} EG | {formatAprNumber(egApr)}%
              </Text>
            </Flex>
          )}
          {!!lmApr && (
            <Flex alignItems="center" sx={{ gap: '4px' }}>
              <TokenLogo src={dexLogo} size={16} />
              <Text fontSize={12} color={theme.subText}>
                {dexName} LM | {formatAprNumber(lmApr)}%
              </Text>
            </Flex>
          )}
          {campaignRows.map(row => (
            <Flex key={row.id} alignItems="center" sx={{ gap: '4px' }}>
              <TokenLogo src={row.icon} size={16} />
              <Text fontSize={12} color={theme.subText}>
                {row.name} | {formatAprNumber(row.apr)}%
              </Text>
            </Flex>
          ))}
        </Flex>
      }
    >
      {children}
    </MouseoverTooltipDesktopOnly>
  )
}
