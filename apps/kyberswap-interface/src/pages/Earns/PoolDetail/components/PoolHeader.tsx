import { formatAprNumber } from '@kyber/utils'
import { shortenAddress } from '@kyber/utils/crypto'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
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
    background: ${({ theme }) => theme.tabActive};
  }
`

const PairTitle = styled(Text)`
  font-size: 24px;
  font-weight: 500;
  white-space: nowrap;
`

const ProtocolBadge = styled(HStack)`
  min-height: 32px;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
  white-space: nowrap;
`

const AprBadge = styled(Text)`
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 4px 12px;
  border-radius: 12px;
  background: ${({ theme }) => rgba(theme.primary, 0.12)};
  color: ${({ theme }) => theme.primary};
  white-space: nowrap;
`

const ProtocolLogo = styled.img`
  flex: 0 0 auto;
  height: 16px;
  width: 16px;
`

const PoolHeader = () => {
  const { pool, poolParams } = usePoolDetailContext()
  const navigate = useNavigate()
  const theme = useTheme()

  const primaryToken = pool?.tokens?.[0]
  const secondaryToken = pool?.tokens?.[1]
  const dexInfo = poolParams.exchange ? EARN_DEXES[poolParams.exchange as Exchange] : undefined
  const chainInfo = poolParams.poolChainId ? NETWORKS_INFO[poolParams.poolChainId as ChainId] : undefined

  const pairTooltip = (
    <Stack minWidth={240} gap={12}>
      {pool && (
        <HStack align="center" gap={8} wrap="wrap">
          <HStack flex="0 0 auto" align="center" gap={0}>
            <TokenLogo src={primaryToken?.logoURI} size={18} />
            <TokenLogo src={secondaryToken?.logoURI} size={18} translateLeft />
          </HStack>
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {primaryToken?.symbol}/{secondaryToken?.symbol}
          </Text>
          <Text color={theme.subText} fontSize={14}>
            {shortenAddress(pool.address, 4)}
          </Text>
          <CopyHelper size={14} margin="0" toCopy={pool.address} />
        </HStack>
      )}

      {primaryToken && (
        <HStack align="center" gap={8} wrap="wrap">
          <TokenLogo src={primaryToken?.logoURI} size={18} />
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {primaryToken?.symbol}
          </Text>
          <Text color={theme.subText} fontSize={14}>
            {shortenAddress(primaryToken.address, 4)}
          </Text>
          <CopyHelper size={14} margin="0" toCopy={primaryToken.address} />
        </HStack>
      )}

      {secondaryToken && (
        <HStack align="center" gap={8} wrap="wrap">
          <TokenLogo src={secondaryToken?.logoURI} size={18} />
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {secondaryToken?.symbol}
          </Text>
          <Text color={theme.subText} fontSize={14}>
            {shortenAddress(secondaryToken.address, 4)}
          </Text>
          <CopyHelper size={14} margin="0" toCopy={secondaryToken.address} />
        </HStack>
      )}
    </Stack>
  )

  return (
    <HStack align="center" gap={8} wrap="wrap">
      <BackButton aria-label="Go back" onClick={() => navigate(-1)} type="button">
        <IconArrowLeft />
      </BackButton>

      <HStack minWidth={0} align="center" gap={12} wrap="wrap">
        <MouseoverTooltipDesktopOnly placement="bottom" text={pairTooltip} width="fit-content">
          <HStack minWidth={0} align="center" gap={8}>
            <HStack flex="0 0 auto" align="flex-end">
              <TokenLogo src={primaryToken?.logoURI} size={28} />
              <TokenLogo src={secondaryToken?.logoURI} size={28} translateLeft />
              <TokenLogo src={chainInfo?.icon} size={16} translateLeft translateTop />
            </HStack>

            <PairTitle color={theme.text}>
              {primaryToken?.symbol || '---'}/{secondaryToken?.symbol || '---'}
            </PairTitle>
          </HStack>
        </MouseoverTooltipDesktopOnly>

        <ProtocolBadge align="center" gap={8}>
          <ProtocolLogo src={dexInfo?.logo} />
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {dexInfo?.name}
          </Text>
          <Text color={theme.subText} fontSize={14} fontWeight={500}>
            | {pool?.swapFee || pool?.feeTier}%
          </Text>
        </ProtocolBadge>

        <AprBadge fontSize={20} fontWeight={500}>
          {formatAprNumber(pool?.allApr ?? pool?.poolStats?.allApr24h ?? 0)}%
        </AprBadge>
      </HStack>
    </HStack>
  )
}

export default PoolHeader
