import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { EarnSupportedProtocols, PositionStatus, earnSupportedProtocols } from 'services/zapEarn'

import CopyHelper from 'components/Copy'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

import { ParsedPosition } from '.'
import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'
import { Badge, BadgeType, ChainImage, DexImage, ImageContainer, PositionOverview } from '../UserPositions/styles'
import { DexInfo, IconArrowLeft } from './styles'

const PositionDetailHeader = ({ position }: { position: ParsedPosition }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const onOpenPositionInDexSite = () => {
    if (!position || !earnSupportedProtocols.includes(position.dex)) return

    const chainName =
      position.dex === EarnSupportedProtocols.UNISWAP_V3 && position.chainName === 'eth'
        ? 'ethereum'
        : position.chainName

    if (position.dex === EarnSupportedProtocols.UNISWAP_V3)
      window.open(`https://app.uniswap.org/positions/v3/${chainName}/${position.id}`)
    else if (position.dex === EarnSupportedProtocols.SUSHISWAP_V3)
      window.open(`https://www.sushi.com/${chainName}/pool/v3/${position.poolAddress}/${position.id}`)
    else if (position.dex === EarnSupportedProtocols.PANCAKESWAP_V3)
      window.open(`https://pancakeswap.finance/liquidity/${position.id}`)
  }

  return (
    <Flex sx={{ gap: 3 }}>
      <IconArrowLeft onClick={() => navigate(-1)} />
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
          <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
            #{position.id}
          </Text>
          <Badge type={position.status === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
            ● {position.status === PositionStatus.IN_RANGE ? t`In range` : t`Out of range`}
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
