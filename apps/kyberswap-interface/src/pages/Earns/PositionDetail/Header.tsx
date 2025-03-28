import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { PositionStatus, ParsedPosition } from 'pages/Earns/types'
import { EarnDex, earnSupportedProtocols, PROTOCOL_POSITION_URL, DEXES_HIDE_TOKEN_ID } from 'pages/Earns/constants'

import CopyHelper from 'components/Copy'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

import { CurrencyRoundedImage, CurrencySecondImage } from 'pages/Earns/PoolExplorer/styles'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  ImageContainer,
  PositionOverview,
} from 'pages/Earns/UserPositions/styles'
import { DexInfo, IconArrowLeft } from 'pages/Earns/PositionDetail/styles'

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

  const isUniv2 = position.dex === EarnDex.DEX_UNISWAPV2
  const posStatus = isUniv2 ? PositionStatus.IN_RANGE : position.status

  const onOpenPositionInDexSite = () => {
    if (!position || !earnSupportedProtocols.includes(position.dex)) return

    const chainName =
      position.dex === EarnDex.DEX_UNISWAPV3 && position.chainName === 'eth' ? 'ethereum' : position.chainName
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
            <Text fontSize={14}>
              {position.poolAddress ? shortenAddress(position.chainId as ChainId, position.poolAddress, 4) : ''}
            </Text>
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
