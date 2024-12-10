// import { ArrowLeft } from 'react-feather'
// import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import CopyHelper from 'components/Copy'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  ImageContainer,
  PositionOverview,
  PositionPageWrapper,
} from '../MyPositions/styles'
import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'

const PositionDetail = () => {
  const theme = useTheme()
  // const navigate = useNavigate()
  // const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <PositionPageWrapper>
      <PositionOverview>
        <Flex alignItems={'center'} sx={{ gap: 2 }}>
          <ImageContainer>
            <CurrencyRoundedImage src={'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png'} alt="" />
            <CurrencySecondImage
              src={
                'https://storage.googleapis.com/ks-setting-1d682dca/9ff8336f-d4f0-4966-9409-937f02dfde971697557490973.png'
              }
              alt=""
            />
            <ChainImage
              src="https://storage.googleapis.com/ks-setting-1d682dca/bd00114e-d4a5-4ccd-a80b-e9a1f29b1bc11697613637225.png"
              alt=""
            />
          </ImageContainer>
          <Text marginLeft={-3}>KNC/WETH</Text>
          <Badge>0.05%</Badge>
          <Badge type={BadgeType.PRIMARY}>● In range</Badge>
        </Flex>
        <Flex alignItems={'center'} sx={{ gap: '10px' }}>
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            <DexImage
              src="https://storage.googleapis.com/ks-setting-1d682dca/ae92f5d6-4159-46ca-80c3-4c358269a01b.png"
              alt=""
            />
            <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
              V3
            </Text>
          </Flex>
          <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
            #24654
          </Text>
          <Badge type={BadgeType.SECONDARY}>
            <Text fontSize={14}>0x1234...abcd</Text>
            <CopyHelper size={16} toCopy={''} />
          </Badge>
        </Flex>
      </PositionOverview>
    </PositionPageWrapper>
  )
}

export default PositionDetail
