import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

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
  const theme = useTheme()
  return (
    <Flex alignItems="center" sx={{ gap: '8px' }} flexWrap="wrap">
      {logo && <TokenLogo src={logo} size={18} />}
      <Text color={theme.text} fontSize={14} fontWeight={500}>
        {symbol}
      </Text>
      <Text color={theme.subText} fontSize={14}>
        {isNative ? <Trans>Native token</Trans> : shortenAddress(address || '', 4)}
      </Text>
      {!isNative && address && <CopyHelper size={14} margin="0" toCopy={address} />}
    </Flex>
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
    <Flex
      sx={{ gap: 3 }}
      flexDirection={upToSmall ? 'column' : 'row'}
      alignItems={upToSmall ? 'flex-start' : 'center'}
      justifyContent="space-between"
    >
      <Flex alignItems="center" sx={{ gap: '12px' }} flexWrap="wrap">
        <IconArrowLeft onClick={() => navigate(hadForceLoading ? -2 : -1)} />

        {/* Token pair logos + name with tooltip (matching PoolHeader pattern) */}
        {initialLoading ? (
          <PositionSkeleton width={180} height={28} />
        ) : (
          <MouseoverTooltipDesktopOnly
            placement="bottom"
            text={
              <Flex flexDirection="column" sx={{ gap: '12px', minWidth: '240px' }}>
                {/* Pool info row */}
                <Flex alignItems="center" sx={{ gap: '8px' }} flexWrap="wrap">
                  <Flex alignItems="center" sx={{ gap: 0 }} style={{ flex: '0 0 auto' }}>
                    <TokenLogo src={position?.token0.logo} size={18} />
                    <TokenLogo src={position?.token1.logo} size={18} translateLeft />
                  </Flex>
                  <Text color={theme.text} fontSize={14} fontWeight={500}>
                    {position?.token0.symbol}/{position?.token1.symbol}
                  </Text>
                  <Text color={theme.subText} fontSize={14}>
                    {shortenAddress(position?.pool.address || '', 4)}
                  </Text>
                  <CopyHelper size={14} margin="0" toCopy={position?.pool.address || ''} />
                </Flex>

                {/* Token 0 address row */}
                <TokenAddressRow
                  logo={position?.token0.logo}
                  symbol={position?.token0.symbol}
                  address={position?.token0.address}
                  isNative={position?.token0.isNative}
                />

                {/* Token 1 address row */}
                <TokenAddressRow
                  logo={position?.token1.logo}
                  symbol={position?.token1.symbol}
                  address={position?.token1.address}
                  isNative={position?.token1.isNative}
                />
              </Flex>
            }
            width="fit-content"
          >
            <Link
              to={`${APP_PATHS.EARN_POOLS}?exchange=${position?.dex.id}&poolChainId=${position?.chain.id}&poolAddress=${position?.pool.address}`}
              style={{ textDecoration: 'none' }}
            >
              <Flex alignItems="center" sx={{ gap: '8px', cursor: 'pointer' }}>
                <ImageContainer>
                  <TokenLogo src={position?.token0.logo} size={28} />
                  <TokenLogo src={position?.token1.logo} size={28} translateLeft />
                  <TokenLogo src={position?.chain.logo} size={16} translateLeft translateTop />
                </ImageContainer>
                <Text
                  color={theme.text}
                  marginLeft={-2.5}
                  fontSize={24}
                  fontWeight={500}
                  lineHeight="28px"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {position?.token0.symbol}/{position?.token1.symbol}
                </Text>
              </Flex>
            </Link>
          </MouseoverTooltipDesktopOnly>
        )}

        {/* DEX info badge - clickable to open dex site */}
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
              <Text fontSize={14} color={rgba(theme.white, 0.7)} style={{ whiteSpace: 'nowrap' }}>
                {position?.dex.name} | {position?.pool.fee}%{!isUniv2 && ` | #${position?.tokenId}`}
              </Text>
            </DexInfoBadge>
          </MouseoverTooltipDesktopOnly>
        )}

        {/* Status badge */}
        {initialLoading ? <PositionSkeleton width={80} height={24} /> : isUnfinalized ? null : statusBadge}

        {/* Smart exit indicator */}
        {hasActiveSmartExitOrder && (
          <MouseoverTooltipDesktopOnly
            text={
              <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                <Trans>This position has an active Smart Exit order.</Trans>
                <br />
                <Trans>
                  View or manage it in{' '}
                  <Link to={APP_PATHS.EARN_SMART_EXIT} style={{ color: theme.subText, textDecoration: 'underline' }}>
                    View Smart Exit Orders
                  </Link>
                  .
                </Trans>
              </Text>
            }
            width="fit-content"
            placement="bottom"
          >
            <Flex
              alignItems="center"
              justifyContent="center"
              sx={{ cursor: 'pointer', borderRadius: '30px' }}
              backgroundColor={rgba(theme.white, 0.04)}
              width={32}
              height={32}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                navigate(APP_PATHS.EARN_SMART_EXIT)
              }}
            >
              <ListSmartExitIcon width={16} height={16} />
            </Flex>
          </MouseoverTooltipDesktopOnly>
        )}

        {isLoading && !initialLoading && <Loader />}
      </Flex>

      <Flex sx={{ gap: 3 }}>
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
      </Flex>
    </Flex>
  )
}

export default PositionDetailHeader
