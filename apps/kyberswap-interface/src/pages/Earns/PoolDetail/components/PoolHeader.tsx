import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ShareModal, ShareModalProps, ShareType } from '@kyber/ui'
import { shortenAddress } from '@kyber/utils/crypto'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { PoolDetailToken } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { NetworkInfo } from 'constants/networks/type'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { IconArrowLeft, ShareButtonWrapper } from 'pages/Earns/PositionDetail/styles'
import { formatDisplayNumber } from 'utils/numbers'

const TooltipAddressRow = ({ token, chainInfo }: { token: PoolDetailToken; chainInfo: NetworkInfo }) => {
  const isNativeToken = token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
  const tokenLogo = isNativeToken ? chainInfo.nativeToken.logo : token.logoURI
  const tokenSymbol = isNativeToken ? chainInfo.nativeToken.symbol : token.symbol

  return (
    <HStack align="center" gap={8} wrap="wrap">
      <TokenLogo src={tokenLogo} size={20} />
      <span className="text-sm font-medium">{tokenSymbol}</span>
      <span className="text-sm">{isNativeToken ? 'Native Token' : shortenAddress(token.address, 4)}</span>
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
          fees: (poolStats?.apr24h || 0) + bonusApr,
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
        <span className="text-sm font-medium text-text">
          {primaryToken.symbol}/{secondaryToken.symbol}
        </span>
        <span className="text-sm text-subText">{shortenAddress(pool.address, 4)}</span>
        <CopyHelper size={14} margin="0" toCopy={pool.address} />
      </HStack>
      <TooltipAddressRow token={primaryToken} chainInfo={chainInfo} />
      <TooltipAddressRow token={secondaryToken} chainInfo={chainInfo} />
    </Stack>
  )

  return (
    <>
      <HStack align="center" gap={8} wrap="wrap">
        <button
          aria-label="Go back"
          onClick={() => navigate(-1)}
          type="button"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-text hover:bg-tabActive"
        >
          <IconArrowLeft />
        </button>

        <HStack minWidth={0} align="center" gap={12} wrap="wrap">
          <HStack minWidth={0} align="center" gap={12}>
            <HStack flex="0 0 auto" align="flex-end">
              <TokenLogo src={primaryToken.logoURI} size={28} />
              <TokenLogo src={secondaryToken.logoURI} size={28} translateLeft />
              <TokenLogo src={chainInfo.icon} size={16} translateLeft translateTop />
            </HStack>

            <span className="whitespace-nowrap text-2xl font-medium text-text">
              {primaryToken.symbol}/{secondaryToken.symbol}
            </span>

            <Center className="size-8 rounded-lg bg-buttonGray">
              <InfoHelper
                text={tooltipContent}
                size={18}
                margin={false}
                color={theme.blue}
                placement="bottom"
                width="fit-content"
              />
            </Center>
          </HStack>

          <HStack align="center" gap={8}>
            <HStack align="center" gap={8} className="min-h-8 whitespace-nowrap rounded-xl bg-buttonGray px-3 py-2">
              <img alt={dexInfo.name} src={dexInfo.logo} className="size-4 flex-none object-contain" />
              <span className="text-sm font-medium text-text">{dexInfo.name}</span>
              <span className="text-sm font-medium text-subText">
                | {formatDisplayNumber(pool.swapFee, { significantDigits: 4 })}%
              </span>
            </HStack>

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
  const { pool, primaryToken, secondaryToken, dexInfo } = usePoolDetailContext()

  return (
    <HStack minWidth={0} align="center" gap={12}>
      <HStack flex="0 0 auto" align="flex-end" gap={0}>
        <TokenLogo src={primaryToken.logoURI} size={36} />
        <TokenLogo src={secondaryToken.logoURI} size={36} translateLeft />
      </HStack>

      <Stack gap={4}>
        <span className="text-base font-medium text-text">
          {primaryToken.symbol}/{secondaryToken.symbol}
        </span>

        <HStack align="center" gap={8} wrap="wrap">
          <HStack align="center" gap={4}>
            <img alt={dexInfo.name} src={dexInfo.logo} className="size-4 flex-none object-contain" />
            <span className="text-sm text-subText">{dexInfo.name}</span>
          </HStack>

          <Stack className="rounded-full bg-darkText px-3 py-1">
            <span className="text-xs font-medium text-subText">
              Fee {formatDisplayNumber(pool.swapFee, { significantDigits: 4 })}%
            </span>
          </Stack>
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
