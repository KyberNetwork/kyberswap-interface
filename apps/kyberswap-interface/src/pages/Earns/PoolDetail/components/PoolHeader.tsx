import { shortenAddress } from '@kyber/utils/crypto'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { PoolDetailToken } from 'services/zapEarn'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'

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

const ProtocolBadge = styled(HStack)`
  min-height: 32px;
  padding: 8px 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.buttonGray};
  white-space: nowrap;
`

const ProtocolLogo = styled.img`
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  object-fit: contain;
`

const InfoButton = styled(Center)`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.buttonGray};
`

const FeeBadge = styled(Stack)`
  padding: 4px 12px;
  border-radius: 999px;
  background: ${({ theme }) => theme.darkText};
`

const TooltipAddressRow = ({ token }: { token: PoolDetailToken }) => {
  return (
    <HStack align="center" gap={8} wrap="wrap">
      {token.logoURI ? <TokenLogo src={token.logoURI} size={18} /> : null}
      <Text color="inherit" fontSize={14} fontWeight={500}>
        {token.symbol}
      </Text>
      <Text color="inherit" fontSize={14}>
        {shortenAddress(token.address, 4)}
      </Text>
      <CopyHelper margin="0" size={14} toCopy={token.address} />
    </HStack>
  )
}

const PoolHeaderPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { pool, chainInfo, dexInfo, primaryToken, secondaryToken } = usePoolDetailContext()
  const tooltipContent = (
    <Stack minWidth={240} gap={12}>
      <HStack align="center" gap={8} wrap="wrap">
        <HStack flex="0 0 auto" align="center" gap={0}>
          <TokenLogo src={primaryToken.logoURI} size={18} />
          <TokenLogo src={secondaryToken.logoURI} size={18} translateLeft />
        </HStack>
        <Text color={theme.text} fontSize={14} fontWeight={500}>
          {primaryToken.symbol}/{secondaryToken.symbol}
        </Text>
        <Text color={theme.subText} fontSize={14}>
          {shortenAddress(pool.address, 4)}
        </Text>
        <CopyHelper size={14} margin="0" toCopy={pool.address} />
      </HStack>
      <TooltipAddressRow token={primaryToken} />
      <TooltipAddressRow token={secondaryToken} />
    </Stack>
  )

  return (
    <HStack align="center" gap={8} wrap="wrap">
      <BackButton aria-label="Go back" onClick={() => navigate(-1)} type="button">
        <IconArrowLeft />
      </BackButton>

      <HStack minWidth={0} align="center" gap={12} wrap="wrap">
        <HStack minWidth={0} align="center" gap={12}>
          <HStack flex="0 0 auto" align="flex-end">
            <TokenLogo src={primaryToken.logoURI} size={28} />
            <TokenLogo src={secondaryToken.logoURI} size={28} translateLeft />
            <TokenLogo src={chainInfo.icon} size={16} translateLeft translateTop />
          </HStack>

          <Text color={theme.text} fontSize={24} fontWeight={500} sx={{ whiteSpace: 'nowrap' }}>
            {primaryToken.symbol}/{secondaryToken.symbol}
          </Text>

          <InfoButton>
            <InfoHelper
              text={tooltipContent}
              size={18}
              margin={false}
              color={theme.blue}
              placement="bottom"
              width="fit-content"
            />
          </InfoButton>
        </HStack>

        <ProtocolBadge align="center" gap={8}>
          <ProtocolLogo alt={dexInfo.name} src={dexInfo.logo} />
          <Text color={theme.text} fontSize={14} fontWeight={500}>
            {dexInfo.name}
          </Text>
          <Text color={theme.subText} fontSize={14} fontWeight={500}>
            | {pool.swapFee}%
          </Text>
        </ProtocolBadge>
      </HStack>
    </HStack>
  )
}

const PoolHeaderReview = () => {
  const theme = useTheme()
  const { pool, primaryToken, secondaryToken, dexInfo } = usePoolDetailContext()

  return (
    <HStack minWidth={0} align="center" gap={12}>
      <HStack flex="0 0 auto" align="flex-end" gap={0}>
        <TokenLogo src={primaryToken.logoURI} size={36} />
        <TokenLogo src={secondaryToken.logoURI} size={36} translateLeft />
      </HStack>

      <Stack gap={4}>
        <Text color={theme.text} fontSize={16} fontWeight={500}>
          {primaryToken.symbol}/{secondaryToken.symbol}
        </Text>

        <HStack align="center" gap={8} wrap="wrap">
          <HStack align="center" gap={4}>
            <ProtocolLogo alt={dexInfo.name} src={dexInfo.logo} />
            <Text color={theme.subText} fontSize={14}>
              {dexInfo.name}
            </Text>
          </HStack>

          <FeeBadge>
            <Text color={theme.subText} fontSize={12} fontWeight={500}>
              Fee {pool.swapFee}
            </Text>
          </FeeBadge>
        </HStack>
      </Stack>
    </HStack>
  )
}

const PoolHeader = ({ isReview }: { isReview?: boolean }) => {
  if (isReview) {
    return <PoolHeaderReview />
  }
  return <PoolHeaderPage />
}

export default PoolHeader
