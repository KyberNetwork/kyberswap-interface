import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { PositionStatus } from 'pages/Earns/types'
import { getDexVersion } from 'pages/Earns/utils/position'

// Map SmartExitDexType to Exchange - memoized once
const DEX_TYPE_TO_EXCHANGE_MAP = Object.entries(EARN_DEXES).reduce((acc, [exchange, dexInfo]) => {
  if (dexInfo.smartExitDexType) {
    acc[dexInfo.smartExitDexType] = exchange as Exchange
  }
  return acc
}, {} as Record<SmartExitDexType, Exchange>)

// Map SmartExitDexType to Exchange and get dex info
const getDexInfoFromDexType = (dexType: string) => {
  const exchange = DEX_TYPE_TO_EXCHANGE_MAP[dexType as SmartExitDexType]
  if (!exchange) return null

  const dexInfo = EARN_DEXES[exchange]
  return { exchange, dexInfo }
}

type TitleContentProps = {
  order: ParsedSmartExitOrder
  tokenId: string
}

const TitleContent = ({ order, tokenId }: TitleContentProps) => {
  const theme = useTheme()

  if (!order.position) {
    // Show placeholder with order info when position is not available
    const chainInfo = NETWORKS_INFO[order.chainId as ChainId]
    const dexMapping = getDexInfoFromDexType(order.dexType)
    const dexVersion = dexMapping ? getDexVersion(dexMapping.exchange) : ''

    return (
      <>
        <Flex alignItems="center" sx={{ opacity: 0.6 }}>
          <ImageContainer>
            <TokenLogo src={UnknownToken} size={24} style={{ opacity: 0.6 }} />
            <TokenLogo src={UnknownToken} size={24} translateLeft style={{ opacity: 0.6 }} />
            {chainInfo?.icon && (
              <TokenLogo src={chainInfo.icon} size={12} translateLeft translateTop style={{ opacity: 0.6 }} />
            )}
          </ImageContainer>
          <Text mr="8px" color={theme.subText} fontStyle="italic">
            <Trans>Position</Trans> #{tokenId}
          </Text>
        </Flex>
        <Flex alignItems="center" sx={{ gap: '4px', opacity: 0.6 }} mt="4px" ml="1rem">
          {dexMapping?.dexInfo.logo && <TokenLogo src={dexMapping.dexInfo.logo} size={16} style={{ opacity: 0.6 }} />}
          {dexVersion && (
            <Text color={theme.subText} fontStyle="italic" fontSize={14}>
              {dexVersion}
            </Text>
          )}
        </Flex>
      </>
    )
  }

  const posDetail = order.position
  const protocol = getDexVersion(posDetail.dex.id)
  const posStatus = posDetail.status || PositionStatus.IN_RANGE

  // Build position detail URL
  const positionDetailUrl = APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', order.positionId)
    .replace(':chainId', order.chainId.toString())
    .replace(':exchange', posDetail.dex.id)

  return (
    <>
      <Flex alignItems="center">
        <ImageContainer>
          <TokenLogo src={posDetail.token0.logo} />
          <TokenLogo src={posDetail.token1.logo} translateLeft />
          <TokenLogo src={posDetail.chain.logo} size={12} translateLeft translateTop />
        </ImageContainer>
        <Link to={positionDetailUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Text mr="8px" sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            {posDetail.token0.symbol}/{posDetail.token1.symbol}
          </Text>
        </Link>
        <Badge>Fee {posDetail.poolFee}%</Badge>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }} mt="4px" ml="1rem">
        <TokenLogo src={posDetail.dex.logo} size={16} />
        <Text color={theme.subText} fontSize={14}>
          {protocol} #{tokenId}
        </Text>
        <Badge
          type={
            posStatus === PositionStatus.IN_RANGE
              ? BadgeType.PRIMARY
              : posStatus === PositionStatus.OUT_RANGE
              ? BadgeType.WARNING
              : BadgeType.DISABLED
          }
        >
          ●{' '}
          {posStatus === PositionStatus.IN_RANGE
            ? t`In range`
            : posStatus === PositionStatus.OUT_RANGE
            ? t`Out of range`
            : t`Closed`}
        </Badge>
      </Flex>
    </>
  )
}

export default TitleContent
