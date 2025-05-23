import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import CopyHelper from 'components/Copy'
import InfoHelper from 'components/InfoHelper'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { DexInfo, IconArrowLeft, PositionHeader } from 'pages/Earns/PositionDetail/styles'
import { Badge, BadgeType, ChainImage, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { CoreProtocol, EarnDex, PROTOCOL_POSITION_URL, earnSupportedProtocols } from 'pages/Earns/constants'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import { MEDIA_WIDTHS } from 'theme'

const PositionDetailHeader = ({
  position,
  hadForceLoading,
}: {
  position: ParsedPosition
  hadForceLoading: boolean
}) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position.status

  const onOpenPositionInDexSite = () => {
    if (!position || !earnSupportedProtocols.includes(position.dex.id)) return

    const positionDetailUrl = PROTOCOL_POSITION_URL[position.dex.id]

    if (!positionDetailUrl) return

    const protocolThatNeedParseEth = [EarnDex.DEX_UNISWAPV3, EarnDex.DEX_UNISWAP_V4, EarnDex.DEX_UNISWAP_V4_FAIRFLOW]
    const parsedUrl = positionDetailUrl
      .replace(
        '$chainName',
        protocolThatNeedParseEth.includes(position.dex.id) && position.chain.name === 'eth'
          ? 'ethereum'
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

  return (
    <Flex sx={{ gap: 3 }} marginBottom={1}>
      <PositionHeader>
        <Flex alignItems={'center'} sx={{ gap: 2 }}>
          <IconArrowLeft onClick={() => navigate(hadForceLoading ? -2 : -1)} />
          <ImageContainer>
            <TokenLogo src={position.token0.logo} />
            <TokenLogo src={position.token1.logo} />
            <ChainImage src={position.chain.logo} alt="" />
          </ImageContainer>
          <Text marginLeft={-3} fontSize={upToSmall ? 20 : 16}>
            {position.token0.symbol}/{position.token1.symbol}
          </Text>
          {position.pool.fee && <Badge>Fee {position.pool.fee}%</Badge>}
          <Badge type={BadgeType.ROUNDED}>
            <InfoHelper
              color={theme.blue2}
              size={16}
              width="fit-content"
              text={
                <Flex alignItems={'center'} sx={{ gap: 1 }} color={theme.blue2}>
                  <Text fontSize={14}>{position.pool.address}</Text>
                  <CopyHelper size={16} toCopy={position.pool.address} />
                </Flex>
              }
              placement="top"
              style={{ marginLeft: 0 }}
            />
          </Badge>
        </Flex>
        <Flex alignItems={'center'} sx={{ gap: '10px' }} flexWrap={'wrap'}>
          {!upToSmall && statusBadge}
          {isUniv2 ? null : (
            <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
              #{position.tokenId}
            </Text>
          )}
          {upToSmall && statusBadge}
          <MouseoverTooltipDesktopOnly
            text={`View this position on ${position.dex.id.split(' ')?.[0] || ''}`}
            width="fit-content"
            placement="top"
          >
            <DexInfo openable={earnSupportedProtocols.includes(position.dex.id)} onClick={onOpenPositionInDexSite}>
              <TokenLogo src={position.dex.logo} size={16} />
              <Text fontSize={14} color={theme.subText}>
                {position.dex.id}
              </Text>
            </DexInfo>
          </MouseoverTooltipDesktopOnly>
        </Flex>
      </PositionHeader>
    </Flex>
  )
}

export default PositionDetailHeader
