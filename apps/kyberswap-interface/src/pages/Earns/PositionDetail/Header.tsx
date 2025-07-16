import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import CopyHelper from 'components/Copy'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { CurrencyRoundedImage, CurrencySecondImage } from 'pages/Earns/PoolExplorer/styles'
import { DexInfo, IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  ImageContainer,
  PositionOverview,
} from 'pages/Earns/UserPositions/styles'
import {
  CoreProtocol,
  DEXES_HIDE_TOKEN_ID,
  EarnDex,
  PROTOCOL_POSITION_URL,
  earnSupportedProtocols,
} from 'pages/Earns/constants'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { isForkFrom, shortenAddress } from 'pages/Earns/utils'
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

  const isUniv2 = isForkFrom(position.dex as EarnDex, CoreProtocol.UniswapV2)
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position.status

  const onOpenPositionInDexSite = () => {
    if (!position || !earnSupportedProtocols.includes(position.dex)) return

    const chainName =
      [EarnDex.DEX_UNISWAPV3, EarnDex.DEX_UNISWAP_V4, EarnDex.DEX_UNISWAPV2].includes(position.dex) &&
      position.chainId === 1
        ? 'ethereum'
        : position.chainName
    const positionId = position.id
    const poolAddress = position.poolAddress
    const positionDetailUrl = PROTOCOL_POSITION_URL[position.dex as EarnDex]

    if (!positionDetailUrl) return
    const parsedUrl = positionDetailUrl
      .replace('$chainName', chainName)
      .replace('$positionId', positionId)
      .replace('$poolAddress', poolAddress)

    window.open(parsedUrl)
  }

  return (
    <Flex sx={{ gap: 3 }}>
      <IconArrowLeft onClick={() => navigate(hadForceLoading ? -2 : -1)} />
      <PositionOverview>
        <Flex alignItems={'center'} sx={{ gap: 2 }}>
          <ImageContainer>
            <CurrencyRoundedImage src={position.token0Logo} alt="" />
            <CurrencySecondImage src={position.token1Logo} alt="" />
            <ChainImage src={position.chainLogo} alt="" />
          </ImageContainer>
          <Text marginLeft={-3} fontSize={upToSmall ? 20 : 16}>
            {position.token0Symbol}/{position.token1Symbol}
          </Text>
          {position.poolFee && <Badge>{position.poolFee}%</Badge>}
        </Flex>
        <Flex alignItems={'center'} sx={{ gap: '10px' }} flexWrap={'wrap'}>
          {DEXES_HIDE_TOKEN_ID[position.dex as EarnDex] ? null : (
            <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
              #{position.id}
            </Text>
          )}
          <Badge type={posStatus === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
            ● {posStatus === PositionStatus.IN_RANGE ? t`In range` : t`Out of range`}
          </Badge>
          <Badge type={BadgeType.SECONDARY}>
            <Text fontSize={14}>{position.poolAddress ? shortenAddress(position.poolAddress, 4) : ''}</Text>
            <CopyHelper size={16} toCopy={position.poolAddress} />
          </Badge>
          <MouseoverTooltipDesktopOnly
            text={`View this position on ${position.dex.split(' ')?.[0] || ''}`}
            width="fit-content"
            placement="top"
          >
            <DexInfo openable={earnSupportedProtocols.includes(position.dex)} onClick={onOpenPositionInDexSite}>
              <DexImage src={position.dexImage} alt="" />
              <Text fontSize={14} color={theme.subText}>
                {position.dex}
              </Text>
            </DexInfo>
          </MouseoverTooltipDesktopOnly>
        </Flex>
      </PositionOverview>
    </Flex>
  )
}

export default PositionDetailHeader
