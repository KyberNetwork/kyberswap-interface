import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Trans, t } from '@lingui/macro'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as IconAlert } from 'assets/svg/earn/ic_alert.svg'
import { ReactComponent as ListSmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ButtonLight } from 'components/Button'
import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { TELEGRAM_BOT_URL } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import { DexInfoBadge, IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useForceLoading from 'pages/Earns/hooks/useForceLoading'
import { PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { hexAlpha } from 'utils/colorAlpha'
import { formatDisplayNumber } from 'utils/numbers'

const TokenAddressRow = ({
  logo,
  symbol,
  address,
  isNative,
}: {
  logo?: string
  symbol?: string
  address?: string
  isNative?: boolean
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {logo && <TokenLogo src={logo} size={18} />}
      <span className="text-sm font-medium text-text">{symbol}</span>
      <span className="text-sm text-subText">
        {isNative ? <Trans>Native token</Trans> : shortenAddress(address || '', 4)}
      </span>
      {!isNative && address && <CopyHelper size={14} margin="0" toCopy={address} />}
    </div>
  )
}

const PositionDetailHeader = () => {
  const { position, loadingInterval: isLoading, initialLoading, hasActiveSmartExitOrder } = usePositionDetailContext()
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { exchange } = useParams()
  const { hadForceLoading } = useForceLoading()

  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position?.status

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

  return (
    <div className={`flex justify-between gap-4 ${upToSmall ? 'flex-col items-start' : 'flex-row items-center'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <IconArrowLeft onClick={() => navigate(hadForceLoading ? -2 : -1)} />

        {initialLoading ? (
          <PositionSkeleton width={180} height={28} />
        ) : (
          <MouseoverTooltipDesktopOnly
            placement="bottom"
            text={
              <div className="flex min-w-[240px] flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex shrink-0 items-center">
                    <TokenLogo src={position?.token0.logo} size={18} />
                    <TokenLogo src={position?.token1.logo} size={18} translateLeft />
                  </div>
                  <span className="text-sm font-medium text-text">
                    {position?.token0.symbol}/{position?.token1.symbol}
                  </span>
                  <span className="text-sm text-subText">{shortenAddress(position?.pool.address || '', 4)}</span>
                  <CopyHelper size={14} margin="0" toCopy={position?.pool.address || ''} />
                </div>

                <TokenAddressRow
                  logo={position?.token0.logo}
                  symbol={position?.token0.symbol}
                  address={position?.token0.address}
                  isNative={position?.token0.isNative && !position?.token0.isWrapped}
                />

                <TokenAddressRow
                  logo={position?.token1.logo}
                  symbol={position?.token1.symbol}
                  address={position?.token1.address}
                  isNative={position?.token1.isNative && !position?.token1.isWrapped}
                />
              </div>
            }
            width="fit-content"
          >
            <Link
              to={`${APP_PATHS.ADD_LIQUIDITY}?exchange=${position?.dex.id}&poolChainId=${position?.chain.id}&poolAddress=${position?.pool.address}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="flex cursor-pointer items-center gap-2">
                <ImageContainer>
                  <TokenLogo src={position?.token0.logo} size={28} />
                  <TokenLogo src={position?.token1.logo} size={28} translateLeft />
                  <TokenLogo src={position?.chain.logo} size={16} translateLeft translateTop />
                </ImageContainer>
                <span
                  className="whitespace-nowrap text-2xl font-medium leading-7 text-text"
                  style={{ marginLeft: '-10px' }}
                >
                  {position?.token0.symbol}/{position?.token1.symbol}
                </span>
              </div>
            </Link>
          </MouseoverTooltipDesktopOnly>
        )}

        {initialLoading ? (
          <PositionSkeleton width={200} height={36} />
        ) : (
          <MouseoverTooltipDesktopOnly
            text={t`View this position on` + ` ${position?.dex?.name?.split(' ')?.[0] || ''}`}
            width="fit-content"
            placement="top"
          >
            <DexInfoBadge
              style={{ cursor: EARN_DEXES[position?.dex.id as Exchange]?.siteUrl ? 'pointer' : 'default' }}
              onClick={onOpenPositionInDexSite}
            >
              <TokenLogo src={position?.dex.logo} size={16} />
              <span className="whitespace-nowrap text-sm" style={{ color: hexAlpha(theme.white, 0.7) }}>
                {position?.dex.name} | {formatDisplayNumber(position?.pool.fee, { significantDigits: 4 })}%
                {!isUniv2 && ` | #${position?.tokenId}`}
              </span>
            </DexInfoBadge>
          </MouseoverTooltipDesktopOnly>
        )}

        {initialLoading ? <PositionSkeleton width={80} height={24} /> : isUnfinalized ? null : statusBadge}

        {hasActiveSmartExitOrder && (
          <MouseoverTooltipDesktopOnly
            text={
              <span className="text-xs leading-4 text-subText">
                <Trans>This position has an active Smart Exit order.</Trans>
                <br />
                <Trans>
                  View or manage it in{' '}
                  <Link to={APP_PATHS.EARN_SMART_EXIT} style={{ color: theme.subText, textDecoration: 'underline' }}>
                    View Smart Exit Orders
                  </Link>
                  .
                </Trans>
              </span>
            }
            width="fit-content"
            placement="bottom"
          >
            <div
              className="flex size-8 cursor-pointer items-center justify-center rounded-[30px]"
              style={{ backgroundColor: hexAlpha(theme.white, 0.04) }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                navigate(APP_PATHS.EARN_SMART_EXIT)
              }}
            >
              <ListSmartExitIcon width={16} height={16} />
            </div>
          </MouseoverTooltipDesktopOnly>
        )}

        {isLoading && !initialLoading && <Loader />}
      </div>

      <div className="flex gap-4">
        <MouseoverTooltipDesktopOnly
          text={t`Get notified via Telegram when this position moves out of range or back in range`}
          width="300px"
          placement="bottom"
        >
          <ButtonLight
            width="36px"
            height="36px"
            style={{ padding: 0 }}
            onClick={() => window.open(TELEGRAM_BOT_URL, '_blank')}
          >
            <IconAlert />
          </ButtonLight>
        </MouseoverTooltipDesktopOnly>
        <NavigateButton
          mobileFullWidth
          icon={<IconUserEarnPosition />}
          text={t`My Positions`}
          to={APP_PATHS.EARN_POSITIONS}
        />
      </div>
    </div>
  )
}

export default PositionDetailHeader
