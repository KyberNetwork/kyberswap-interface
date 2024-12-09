import { t } from '@lingui/macro'
import { Minus, Plus } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import CopyHelper from 'components/Copy'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  Divider,
  ImageContainer,
  MyLiquidityWrapper,
  PositionAction,
  PositionOverview,
  PositionPageWrapper,
  PositionRow,
  PositionValueLabel,
  PositionValueWrapper,
} from './styles'

const MyPositions = () => {
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <PositionPageWrapper>
      <div>
        <Text as="h1" fontSize={24} fontWeight="500">
          {t`My Liquidity`}
        </Text>
        <Text color={theme.subText} marginTop="8px" fontStyle={'italic'}>
          {t`Kyberswap Zap: Instantly and easily add liquidity to high-APY pools using any token or a combination of tokens.`}
        </Text>
      </div>

      <MyLiquidityWrapper>
        <PositionRow>
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
          {upToLarge && !upToSmall && (
            <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
              <PositionAction>
                <Minus size={16} />
              </PositionAction>
              <PositionAction primary>
                <Plus size={16} />
              </PositionAction>
            </Flex>
          )}
          <PositionValueWrapper>
            <PositionValueLabel>Value:</PositionValueLabel>
            <Text>$2,876</Text>
          </PositionValueWrapper>
          <PositionValueWrapper align={upToLarge ? 'center' : ''}>
            <PositionValueLabel>Earn:</PositionValueLabel>
            <Text>$1,76</Text>
          </PositionValueWrapper>
          <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
            <PositionValueLabel>Bal:</PositionValueLabel>
            <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
              <Text>81,265.87 KNC</Text>
              {upToSmall && <Divider />}
              <Text>28.76 WETH</Text>
            </Flex>
          </PositionValueWrapper>
          {(upToSmall || !upToLarge) && (
            <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
              <PositionAction>
                <Minus size={16} />
              </PositionAction>
              <PositionAction primary>
                <Plus size={16} />
              </PositionAction>
            </Flex>
          )}
        </PositionRow>
      </MyLiquidityWrapper>

      <Text
        fontSize={14}
        color={'#737373'}
        textAlign={'center'}
        fontStyle={'italic'}
      >{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Text>
    </PositionPageWrapper>
  )
}

export default MyPositions
