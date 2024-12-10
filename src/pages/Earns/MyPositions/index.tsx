import { t } from '@lingui/macro'
import { Minus, Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { PositionStatus, useUserPositionQuery } from 'services/krystalEarn'

import CopyHelper from 'components/Copy'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'
import useLiquidityWidget from '../useLiquidityWidget'
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
  const navigate = useNavigate()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { account } = useActiveWeb3React()
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()

  const { data: userPosition } = useUserPositionQuery(
    // { addresses: account || '' },
    { addresses: '0xe403043a0f9c7b9f315cf145166eb747d9790e77' },
    { skip: !account, pollingInterval: 15_000 },
  )

  return (
    <>
      {liquidityWidget}
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
          {(userPosition || []).map(position => (
            <PositionRow key={position.tokenId} onClick={() => navigate({ pathname: APP_PATHS.EARN_POSITION_DETAIL })}>
              <PositionOverview>
                <Flex alignItems={'center'} sx={{ gap: 2 }}>
                  <ImageContainer>
                    <CurrencyRoundedImage src={position.pool.tokenAmounts[0]?.token.logo} alt="" />
                    <CurrencySecondImage src={position.pool.tokenAmounts[1]?.token.logo} alt="" />
                    <ChainImage src={position.chainLogo} alt="" />
                  </ImageContainer>
                  <Text marginLeft={-3}>
                    {position.pool.tokenAmounts[0]?.token.symbol || ''}/
                    {position.pool.tokenAmounts[1]?.token.symbol || ''}
                  </Text>
                  {position.pool.fees?.length > 0 && <Badge>{position.pool.fees[0]}%</Badge>}
                  <Badge type={position.status === PositionStatus.IN_RANGE ? BadgeType.PRIMARY : BadgeType.WARNING}>
                    ● {position.status === PositionStatus.IN_RANGE ? 'In range' : 'Out of range'}
                  </Badge>
                </Flex>
                <Flex alignItems={'center'} sx={{ gap: '10px' }}>
                  <Flex alignItems={'center'} sx={{ gap: 1 }}>
                    <DexImage src={position.pool.projectLogo} alt="" />
                    <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                      {position.pool.project?.split(' ')?.[1] || ''}
                    </Text>
                  </Flex>
                  <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                    #{position.tokenId}
                  </Text>
                  <Badge type={BadgeType.SECONDARY}>
                    <Text fontSize={14}>{shortenAddress(position.chainId, position.pool.poolAddress, 4)}</Text>
                    <CopyHelper size={16} toCopy={position.pool.poolAddress} />
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
                <PositionValueLabel>Value</PositionValueLabel>
                <Text>
                  {formatDisplayNumber(position.currentPositionValue, { style: 'currency', significantDigits: 6 })}
                </Text>
              </PositionValueWrapper>
              <PositionValueWrapper align={upToLarge ? 'center' : ''}>
                <PositionValueLabel>Earned Fee</PositionValueLabel>
                <Text>
                  {formatDisplayNumber(
                    position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0),
                    { style: 'currency', significantDigits: 6 },
                  )}
                </Text>
              </PositionValueWrapper>
              <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                <PositionValueLabel>Bal</PositionValueLabel>
                <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                  <Text>
                    {formatDisplayNumber(
                      position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price,
                      { significantDigits: 6 },
                    )}{' '}
                    {position.pool.tokenAmounts[0]?.token.symbol || ''}
                  </Text>
                  {upToSmall && <Divider />}
                  <Text>
                    {formatDisplayNumber(
                      position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price,
                      { significantDigits: 6 },
                    )}{' '}
                    {position.pool.tokenAmounts[1]?.token.symbol || ''}
                  </Text>
                </Flex>
              </PositionValueWrapper>
              {(upToSmall || !upToLarge) && (
                <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
                  <PositionAction>
                    <Minus size={16} />
                  </PositionAction>
                  <PositionAction
                    primary
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenZapInWidget(
                        {
                          exchange: position.pool.project || '',
                          chainId: position.chainId,
                          address: position.pool.poolAddress,
                        },
                        position.tokenId,
                      )
                    }}
                  >
                    <Plus size={16} />
                  </PositionAction>
                </Flex>
              )}
            </PositionRow>
          ))}
        </MyLiquidityWrapper>

        <Text
          fontSize={14}
          color={'#737373'}
          textAlign={'center'}
          fontStyle={'italic'}
        >{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Text>
      </PositionPageWrapper>
    </>
  )
}

export default MyPositions
