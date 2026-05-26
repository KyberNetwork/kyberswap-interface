import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ShareModal, ShareModalProps, ShareType } from '@kyber/ui'
import { shortenAddress } from '@kyber/utils/crypto'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { PoolDetailToken } from 'services/zapEarn'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { NetworkInfo } from 'constants/networks/type'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { IconArrowLeft, ShareButtonWrapper } from 'pages/Earns/PositionDetail/styles'
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

const TooltipAddressRow = ({ token, chainInfo }: { token: PoolDetailToken; chainInfo: NetworkInfo }) => {
  const isNativeToken = token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
  const tokenLogo = isNativeToken ? chainInfo.nativeToken.logo : token.logoURI
  const tokenSymbol = isNativeToken ? chainInfo.nativeToken.symbol : token.symbol

  return (
    <HStack align="center" gap={8} wrap="wrap">
      <TokenLogo src={tokenLogo} size={20} />
      <Text color="inherit" fontSize={14} fontWeight={500}>
        {tokenSymbol}
      </Text>
      <Text color="inherit" fontSize={14}>
        {isNativeToken ? 'Native Token' : shortenAddress(token.address, 4)}
      </Text>
      {!isNativeToken ? <CopyHelper margin="0" size={14} toCopy={token.address} /> : null}
    </HStack>
  )
}

const PoolHeaderPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { pool, chainInfo, dexInfo, exchange, chainId, primaryToken, secondaryToken } = usePoolDetailContext()
  const [shareInfo, setShareInfo] = useState<ShareModalProps | undefined>()

  const isFarming = Boolean(pool.programs?.includes('eg') || pool.programs?.includes('lm'))
  const poolStats = pool.poolStats
  const hasActiveApr = poolStats?.activeApr !== undefined
  const bonusApr = poolStats?.bonusApr || 0
  const activeTotal = hasActiveApr ? (poolStats?.activeApr || 0) + bonusApr : undefined

  const handleOpenShare = () => {
    setShareInfo({
      isFarming,
      hasActiveApr,
      type: ShareType.POOL_INFO,
      onClose: () => setShareInfo(undefined),
      pool: {
        feeTier: pool.swapFee,
        address: pool.address,
        chainId,
        chainLogo: chainInfo.icon,
        dexLogo: dexInfo.logo,
        dexName: dexInfo.name,
        exchange,
        token0: { symbol: primaryToken.symbol, logo: primaryToken.logoURI || '' },
        token1: { symbol: secondaryToken.symbol, logo: secondaryToken.logoURI || '' },
        apr: {
          fees: (poolStats?.lpApr24h || 0) + bonusApr,
          eg: poolStats?.kemEGApr24h || 0,
          lm: poolStats?.kemLMApr24h || 0,
          activeTotal,
          activeEg: poolStats?.activeEgApr,
          activeLm: poolStats?.activeLmApr,
        },
      },
    })
  }

  const tooltipContent = (
    <Stack minWidth={240} gap={4}>
      <HStack align="center" gap={8} wrap="wrap">
        <HStack flex="0 0 auto" align="center" gap={0}>
          <TokenLogo src={primaryToken.logoURI} size={20} />
          <TokenLogo src={secondaryToken.logoURI} size={20} translateLeft />
        </HStack>
        <Text color={theme.text} fontSize={14} fontWeight={500}>
          {primaryToken.symbol}/{secondaryToken.symbol}
        </Text>
        <Text color={theme.subText} fontSize={14}>
          {shortenAddress(pool.address, 4)}
        </Text>
        <CopyHelper size={14} margin="0" toCopy={pool.address} />
      </HStack>
      <TooltipAddressRow token={primaryToken} chainInfo={chainInfo} />
      <TooltipAddressRow token={secondaryToken} chainInfo={chainInfo} />
    </Stack>
  )

  return (
    <>
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

          <HStack align="center" gap={8}>
            <ProtocolBadge align="center" gap={8}>
              <ProtocolLogo alt={dexInfo.name} src={dexInfo.logo} />
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                {dexInfo.name}
              </Text>
              <Text color={theme.subText} fontSize={14} fontWeight={500}>
                | {formatDisplayNumber(pool.swapFee, { significantDigits: 4 })}%
              </Text>
            </ProtocolBadge>

            <ShareButtonWrapper aria-label="Share pool" onClick={handleOpenShare}>
              <Share2 size={16} color={theme.primary} />
            </ShareButtonWrapper>

            {shareInfo && <ShareModal {...shareInfo} />}
          </HStack>
        </HStack>
      </HStack>
    </>
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
              Fee {formatDisplayNumber(pool.swapFee, { significantDigits: 4 })}%
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
