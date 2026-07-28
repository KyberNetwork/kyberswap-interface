import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Trans, t } from '@lingui/macro'
import { Link, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { DexInfo, PositionHeader as Header } from 'pages/Earns/components/SmartExit/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { getPoolDetailUrl } from 'pages/Earns/utils/url'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const PositionHeader = ({
  position,
  isLoading,
  initialLoading,
  style = {},
}: {
  position?: ParsedPosition | null
  isLoading: boolean
  initialLoading: boolean
  style?: React.CSSProperties
}) => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { exchange } = useParams()

  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position?.status

  const onOpenPositionInDexSite = () => {
    if (!position || !EARN_DEXES[position.dex.id]) return

    const positionDetailUrl = EARN_DEXES[position.dex.id].siteUrl

    if (!positionDetailUrl) return

    const protocolThatNeedParse = [
      Exchange.DEX_UNISWAPV2,
      Exchange.DEX_UNISWAPV3,
      Exchange.DEX_UNISWAP_V4,
      Exchange.DEX_UNISWAP_V4_FAIRFLOW,
    ]
    const parsedUrl = positionDetailUrl
      .replace(
        '$chainName',
        protocolThatNeedParse.includes(position.dex.id) && position.chain.name === 'eth'
          ? 'ethereum'
          : protocolThatNeedParse.includes(position.dex.id) && position.chain.name === 'bsc'
          ? 'bnb'
          : position.chain.name,
      )
      .replace('$positionId', position.tokenId)
      .replace('$poolAddress', position.pool.address)

    window.open(parsedUrl)
  }

  const statusBadge = (
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
  )

  const isUnfinalized = position?.isUnfinalized

  return (
    <div
      className={cn('mb-1 flex items-center justify-between gap-4', upToLarge ? 'flex-col' : 'flex-row')}
      style={style}
    >
      <Header>
        <div className="flex items-center gap-2">
          {initialLoading ? (
            <PositionSkeleton width={125} height={28} />
          ) : (
            <div className="flex items-center gap-2">
              <ImageContainer>
                <TokenLogo src={position?.token0.logo} />
                <TokenLogo src={position?.token1.logo} translateLeft />
                <TokenLogo src={position?.chain.logo} size={12} translateLeft translateTop />
              </ImageContainer>
              <Link to={getPoolDetailUrl(position?.chain.id, position?.dex.id ?? '', position?.pool.address ?? '')}>
                <span className={cn('-ml-2.5 text-text', upToSmall ? 'text-xl' : 'text-base')}>
                  {position?.token0.symbol}/{position?.token1.symbol}
                </span>
              </Link>
            </div>
          )}

          {initialLoading ? (
            <PositionSkeleton width={80} height={22} />
          ) : (
            <Badge>Fee {formatDisplayNumber(position?.pool.fee, { significantDigits: 4 })}%</Badge>
          )}

          {initialLoading ? (
            <PositionSkeleton width={32} height={32} />
          ) : (
            <Badge type={BadgeType.ROUNDED}>
              <InfoHelperWithDelay
                text={
                  <div className="flex flex-col gap-1 text-xs text-subText">
                    <div className="flex items-center gap-2">
                      <span>{position?.token0.symbol}: </span>
                      <span>
                        {position?.token0.isNative ? (
                          <Trans>Native token</Trans>
                        ) : (
                          shortenAddress(position?.token0.address || '', 4)
                        )}
                      </span>
                      {!position?.token0.isNative && <CopyHelper size={16} toCopy={position?.token0.address || ''} />}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{position?.token1.symbol}: </span>
                      <span>
                        {position?.token1.isNative ? (
                          <Trans>Native token</Trans>
                        ) : (
                          shortenAddress(position?.token1.address || '', 4)
                        )}
                      </span>
                      {!position?.token1.isNative && <CopyHelper size={16} toCopy={position?.token1.address || ''} />}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>
                        <Trans>Pool Address:</Trans>{' '}
                      </span>
                      <span>{shortenAddress(position?.pool.address || '', 4)}</span>
                      <CopyHelper size={16} toCopy={position?.pool.address || ''} />
                    </div>
                  </div>
                }
                size={16}
                className="text-blue2"
                placement="top"
                width="fit-content"
              />
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {!upToSmall &&
            (initialLoading ? <PositionSkeleton width={112} height={23} /> : isUnfinalized ? null : statusBadge)}

          {isUniv2 ? null : initialLoading ? (
            <PositionSkeleton width={50} height={16} />
          ) : (
            <span className={cn('text-subText', upToSmall ? 'text-base' : 'text-sm')}>#{position?.tokenId}</span>
          )}

          {upToSmall &&
            (initialLoading ? <PositionSkeleton width={112} height={23} /> : isUnfinalized ? null : statusBadge)}

          {initialLoading ? (
            <PositionSkeleton width={150} height={16} />
          ) : (
            <MouseoverTooltipDesktopOnly
              text={t`View this position on` + ` ${position?.dex?.name?.split(' ')?.[0] || ''}`}
              width="fit-content"
              placement="top"
            >
              <DexInfo
                openable={EARN_DEXES[position?.dex.id as Exchange] ? true : false}
                onClick={onOpenPositionInDexSite}
              >
                <TokenLogo src={position?.dex.logo} size={16} />
                <span className="whitespace-nowrap text-sm text-subText">{position?.dex.name}</span>
              </DexInfo>
            </MouseoverTooltipDesktopOnly>
          )}

          {isLoading && !initialLoading && <Loader />}
        </div>
      </Header>
    </div>
  )
}

export default PositionHeader
