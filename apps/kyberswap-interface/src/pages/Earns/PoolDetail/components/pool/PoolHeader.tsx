import { ChainId } from '@kyberswap/ks-sdk-core'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { PoolDetail as PoolDetailData } from 'services/zapEarn'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

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
  font-weight: 600;
  line-height: 1.2;
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
  padding: 6px 12px;
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
  pool?: EarnPool
  poolDetail?: PoolDetailData
  chainId?: number
  exchange?: string
}

const PoolHeader = ({ pool, poolDetail, chainId, exchange }: PoolHeaderProps) => {
  const navigate = useNavigate()
  const theme = useTheme()

  const primaryToken = pool?.tokens?.[0] || poolDetail?.tokens?.[0]
  const secondaryToken = pool?.tokens?.[1] || poolDetail?.tokens?.[1]
  const pairLabel = primaryToken && secondaryToken ? `${primaryToken.symbol}/${secondaryToken.symbol}` : 'Pool Detail'
  const dexInfo = exchange ? EARN_DEXES[exchange as Exchange] : undefined
  const chainLogo = chainId ? NETWORKS_INFO[chainId as ChainId]?.icon : undefined
  const feeLabel =
    pool?.feeTier !== undefined
      ? `${pool.feeTier}%`
      : poolDetail?.swapFee !== undefined
      ? `${poolDetail.swapFee}%`
      : undefined
  const aprValue = pool?.allApr
  const dexLabel = dexInfo?.name || poolDetail?.type

  return (
    <HeaderRow>
      <BackButton aria-label="Go back" onClick={() => navigate(-1)} type="button">
        <IconArrowLeft />
      </BackButton>

      <HStack flex="0 0 auto" align="flex-end" gap={0}>
        <TokenLogo src={primaryToken && 'logoURI' in primaryToken ? primaryToken.logoURI : ''} size={28} />
        <TokenLogo
          src={secondaryToken && 'logoURI' in secondaryToken ? secondaryToken.logoURI : ''}
          size={28}
          translateLeft
        />
        {chainLogo ? <TokenLogo src={chainLogo} size={16} translateLeft translateTop /> : null}
      </HStack>

      <HStack align="center" gap={8} wrap="wrap" minWidth={0}>
        <PairTitle color={theme.text}>{pairLabel}</PairTitle>
        {dexLabel || feeLabel ? (
          <ProtocolBadge align="center" gap={8}>
            {dexInfo?.logo ? <ProtocolLogo alt={dexLabel || 'Protocol'} src={dexInfo.logo} /> : null}
            {dexLabel ? (
              <Text color={theme.text} fontSize={14} fontWeight={500} lineHeight="1" m={0}>
                {dexLabel}
              </Text>
            ) : null}
            {feeLabel ? (
              <Text color={theme.subText} fontSize={14} fontWeight={400} lineHeight="1" m={0}>
                | {feeLabel}
              </Text>
            ) : null}
          </ProtocolBadge>
        ) : null}
        {aprValue !== undefined ? (
          <AprBadge color={theme.primary} fontSize={14} fontWeight={600} lineHeight="1">
            {formatDisplayNumber(aprValue / 100, { style: 'percent', significantDigits: 4 })}
          </AprBadge>
        ) : null}
      </HStack>
    </HeaderRow>
  )
}

export default PoolHeader
