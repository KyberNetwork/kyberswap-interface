import { formatAprNumber } from '@kyber/utils'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  :hover {
    background: rgba(255, 255, 255, 0.06);
  }
`

const HeaderRow = styled(HStack)`
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  min-width: 0;
  padding: 0;
  width: 100%;
`

const PairTitle = styled(Text)`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  white-space: nowrap;
`

const ProtocolBadge = styled(HStack)`
  min-height: 32px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  white-space: nowrap;
`

const AprBadge = styled(Text)`
  display: flex;
  align-items: center;
  margin: 0;
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(49, 203, 158, 0.18);
  white-space: nowrap;
`

const ProtocolLogo = styled.img`
  flex: 0 0 auto;
  height: 14px;
  object-fit: contain;
  width: 14px;
`

interface PoolHeaderProps {
  pool?: Pool
  chainId?: number
  exchange?: string
}

const PoolHeader = ({ pool, chainId, exchange }: PoolHeaderProps) => {
  const navigate = useNavigate()
  const theme = useTheme()

  const primaryToken = pool?.tokens?.[0]
  const secondaryToken = pool?.tokens?.[1]
  const dexInfo = exchange ? EARN_DEXES[exchange as Exchange] : undefined
  const chainInfo = chainId ? NETWORKS_INFO[chainId as ChainId] : undefined

  return (
    <HeaderRow>
      <BackButton aria-label="Go back" onClick={() => navigate(-1)} type="button">
        <IconArrowLeft />
      </BackButton>

      <HStack flex="0 0 auto" align="flex-end" gap={0}>
        <TokenLogo src={primaryToken?.logoURI} size={28} />
        <TokenLogo src={secondaryToken?.logoURI} size={28} translateLeft />
        <TokenLogo src={chainInfo?.icon} size={16} translateLeft translateTop />
      </HStack>

      <HStack align="center" gap={8} wrap="wrap" minWidth={0}>
        <PairTitle color={theme.text}>
          {primaryToken?.symbol || '---'}/{secondaryToken?.symbol || '---'}
        </PairTitle>

        <ProtocolBadge align="center" gap={8}>
          <ProtocolLogo src={dexInfo?.logo} />
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {dexInfo?.name}
          </Text>
          <Text color={theme.subText} fontSize={14} fontWeight={500}>
            | {pool?.swapFee || pool?.feeTier}%
          </Text>
        </ProtocolBadge>

        <AprBadge color={theme.primary} fontSize={20} fontWeight={600}>
          {formatAprNumber(pool?.allApr ?? pool?.poolStats?.allApr24h ?? 0)}%
        </AprBadge>
      </HStack>
    </HeaderRow>
  )
}

export default PoolHeader
