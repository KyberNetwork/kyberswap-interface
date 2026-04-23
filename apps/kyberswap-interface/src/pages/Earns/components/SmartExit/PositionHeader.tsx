import { shortenAddress } from '@kyber/utils/dist/crypto'
import { Trans, t } from '@lingui/macro'
import { Link, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import CopyHelper from 'components/Copy'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { DexInfo, PositionHeader as Header } from 'pages/Earns/components/SmartExit/styles'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
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
  const theme = useTheme()
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
    <Flex
      sx={{ gap: 3 }}
      flexDirection={upToLarge ? 'column' : 'row'}
      alignItems="center"
      justifyContent="space-between"
      marginBottom={1}
      style={style}
    >
      <Header>
        <Flex alignItems={'center'} sx={{ gap: 2 }}>
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
                  <Flex flexDirection="column" sx={{ gap: 1 }} style={{ fontSize: 12 }} color={theme.subText}>
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <Text>{position?.token0.symbol}: </Text>
                      <Text>
                        {position?.token0.isNative ? (
                          <Trans>Native token</Trans>
                        ) : (
                          shortenAddress(position?.token0.address || '', 4)
                        )}
                      </Text>
                      {!position?.token0.isNative && <CopyHelper size={16} toCopy={position?.token0.address || ''} />}
                    </Flex>
                    <Flex alignItems="center" sx={{ gap: 1 }}>
                      <Text>{position?.token1.symbol}: </Text>
                      <Text>
                        {position?.token1.isNative ? (
                          <Trans>Native token</Trans>
                        ) : (
                          shortenAddress(position?.token1.address || '', 4)
                        )}
                      </Text>
                      {!position?.token1.isNative && <CopyHelper size={16} toCopy={position?.token1.address || ''} />}
                    </Flex>
                    <Flex alignItems="center" sx={{ gap: 1 }}>
                      <Text>
                        <Trans>Pool Address:</Trans>{' '}
                      </Text>
                      <Text>{shortenAddress(position?.pool.address || '', 4)}</Text>
                      <CopyHelper size={16} toCopy={position?.pool.address || ''} />
                    </Flex>
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
              text={t`View this position on` + ` ${position?.dex?.name?.split(' ')?.[0] || ''}`}
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
      </Header>
    </Flex>
  )
}

export default PositionHeader
