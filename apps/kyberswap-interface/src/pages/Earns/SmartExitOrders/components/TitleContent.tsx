import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
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
  if (!order.position) {
    // Show placeholder with order info when position is not available
    const chainInfo = NETWORKS_INFO[order.chainId as ChainId]
    const dexMapping = getDexInfoFromDexType(order.dexType)
    const dexVersion = dexMapping ? getDexVersion(dexMapping.exchange) : ''

    return (
      <div className="flex min-w-0 flex-col gap-2 opacity-60">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ImageContainer className="shrink-0">
            <TokenLogo src={UnknownToken} size={24} className="opacity-60" />
            <TokenLogo src={UnknownToken} size={24} translateLeft className="opacity-60" />
            {chainInfo?.icon && (
              <TokenLogo src={chainInfo.icon} size={12} translateLeft translateTop className="opacity-60" />
            )}
          </ImageContainer>
          <span className="min-w-0 truncate italic text-subText">
            <Trans>Position</Trans> #{tokenId}
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {dexMapping?.dexInfo.logo && <TokenLogo src={dexMapping.dexInfo.logo} size={14} className="opacity-60" />}
          {dexVersion && <span className="text-xs italic text-subText">{dexVersion}</span>}
        </div>
      </div>
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
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ImageContainer className="shrink-0">
          <TokenLogo src={posDetail.token0.logo} />
          <TokenLogo src={posDetail.token1.logo} translateLeft />
          <TokenLogo src={posDetail.chain.logo} size={12} translateLeft translateTop />
        </ImageContainer>
        <Link to={positionDetailUrl} className="min-w-0 text-inherit no-underline hover:text-text">
          <span className="block max-w-[140px] cursor-pointer truncate">
            {posDetail.token0.symbol}/{posDetail.token1.symbol}
          </span>
        </Link>
        <Badge className="shrink-0">Fee {posDetail.poolFee}%</Badge>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <TokenLogo src={posDetail.dex.logo} size={14} />
        <span className="text-xs text-subText">
          {protocol} #{tokenId}
        </span>
        <Badge
          className="shrink-0"
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
      </div>
    </div>
  )
}

export default TitleContent
