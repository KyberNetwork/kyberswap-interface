import { shortenAddress } from '@kyber/utils/dist/crypto'
import { t } from '@lingui/macro'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import CopyHelper from 'components/Copy'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import { DexInfo, IconArrowLeft, PositionHeader } from 'pages/Earns/PositionDetail/styles'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import useForceLoading from 'pages/Earns/hooks/useForceLoading'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const PositionDetailHeader = ({
  position,
  isLoading,
  initialLoading,
}: {
  position?: ParsedPosition
  isLoading: boolean
  initialLoading: boolean
}) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const { exchange } = useParams()
  const { hadForceLoading } = useForceLoading()

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
    <Flex
      sx={{ gap: 3 }}
      flexDirection={upToLarge ? 'column' : 'row'}
      alignItems="center"
      justifyContent="space-between"
      marginBottom={1}
    >
      <PositionHeader>
        <Flex alignItems={'center'} sx={{ gap: 2 }}>
          <IconArrowLeft onClick={() => navigate(hadForceLoading ? -2 : -1)} />

          {initialLoading ? (
            <PositionSkeleton width={125} height={28} />
          ) : (
            <Flex alignItems={'center'} sx={{ gap: 2 }}>
              <ImageContainer>
                <TokenLogo src={position?.token0.logo} />
                <TokenLogo src={position?.token1.logo} translateLeft />
                <TokenLogo src={position?.chain.logo} size={12} translateLeft translateTop />
              </ImageContainer>
              <Link
                to={`${APP_PATHS.EARN_POOLS}?exchange=${position?.dex.id}&poolChainId=${position?.chain.id}&poolAddress=${position?.pool.address}`}
              >
                <Text color={theme.text} marginLeft={-2.5} fontSize={upToSmall ? 20 : 16}>
                  {position?.token0.symbol}/{position?.token1.symbol}
                </Text>
              </Link>
            </Flex>
          )}

          {initialLoading ? <PositionSkeleton width={80} height={22} /> : <Badge>Fee {position?.pool.fee}%</Badge>}

          {initialLoading ? (
            <PositionSkeleton width={32} height={32} />
          ) : (
            <Badge type={BadgeType.ROUNDED}>
              <InfoHelperWithDelay
                text={
                  <Flex alignItems={'center'} sx={{ gap: 1 }} color={theme.blue2}>
                    <Text fontSize={14}>{position ? shortenAddress(position?.pool.address || '', 6) : ''}</Text>
                    <CopyHelper size={16} toCopy={position?.pool.address || ''} />
                  </Flex>
                }
                size={16}
                color={theme.blue2}
                placement="top"
                width="fit-content"
              />
            </Badge>
          )}
        </Flex>
        <Flex alignItems={'center'} sx={{ gap: '10px' }} flexWrap={'wrap'}>
          {!upToSmall &&
            (initialLoading ? <PositionSkeleton width={112} height={23} /> : isUnfinalized ? null : statusBadge)}

          {isUniv2 ? null : initialLoading ? (
            <PositionSkeleton width={50} height={16} />
          ) : (
            <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
              #{position?.tokenId}
            </Text>
          )}

          {upToSmall &&
            (initialLoading ? <PositionSkeleton width={112} height={23} /> : isUnfinalized ? null : statusBadge)}

          {initialLoading ? (
            <PositionSkeleton width={150} height={16} />
          ) : (
            <MouseoverTooltipDesktopOnly
              text={`View this position on ${position?.dex?.name?.split(' ')?.[0] || ''}`}
              width="fit-content"
              placement="top"
            >
              <DexInfo
                openable={EARN_DEXES[position?.dex.id as Exchange] ? true : false}
                onClick={onOpenPositionInDexSite}
              >
                <TokenLogo src={position?.dex.logo} size={16} />
                <Text fontSize={14} color={theme.subText}>
                  {position?.dex.name}
                </Text>
              </DexInfo>
            </MouseoverTooltipDesktopOnly>
          )}

          {isLoading && !initialLoading && <Loader />}
        </Flex>
      </PositionHeader>
      <NavigateButton
        mobileFullWidth
        icon={<IconUserEarnPosition />}
        text={t`My Positions`}
        to={APP_PATHS.EARN_POSITIONS}
      />
    </Flex>
  )
}

export default PositionDetailHeader
