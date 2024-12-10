import { t } from '@lingui/macro'
import { useEffect, useRef } from 'react'
import { Minus, Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { PositionStatus, useUserPositionQuery } from 'services/krystalEarn'

import CopyHelper from 'components/Copy'
import LocalLoader from 'components/LocalLoader'
import { MouseoverTooltip } from 'components/Tooltip'
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
  EmptyPositionText,
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
  const firstLoad = useRef(false)

  const { data: userPosition, isLoading } = useUserPositionQuery(
    { addresses: account || '' },
    { skip: !account, pollingInterval: 15_000 },
  )

  useEffect(() => {
    if (!firstLoad.current && isLoading) {
      firstLoad.current = true
    }
  }, [isLoading])

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
          {isLoading && !firstLoad.current ? (
            <LocalLoader />
          ) : userPosition && userPosition.length > 0 ? (
            userPosition.map(position => (
              <PositionRow
                key={position.tokenId}
                onClick={() => navigate({ pathname: APP_PATHS.EARN_POSITION_DETAIL })}
              >
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
                  <MouseoverTooltip
                    text={
                      <>
                        <Text>
                          {formatDisplayNumber(
                            position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price,
                            { significantDigits: 6 },
                          )}{' '}
                          {position.pool.tokenAmounts[0]?.token.symbol || ''}
                        </Text>
                        <Text>
                          {formatDisplayNumber(
                            position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price,
                            { significantDigits: 6 },
                          )}{' '}
                          {position.pool.tokenAmounts[1]?.token.symbol || ''}
                        </Text>
                      </>
                    }
                    width="fit-content"
                    placement="bottom"
                  >
                    <Text>
                      {formatDisplayNumber(position.currentPositionValue, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  </MouseoverTooltip>
                </PositionValueWrapper>
                <PositionValueWrapper align={upToLarge ? 'center' : ''}>
                  <PositionValueLabel>Earned Fee</PositionValueLabel>
                  <MouseoverTooltip
                    text={
                      <>
                        <Text>
                          {formatDisplayNumber(
                            position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price,
                            { significantDigits: 6 },
                          )}{' '}
                          {position.pool.tokenAmounts[0]?.token.symbol || ''}
                        </Text>
                        <Text>
                          {formatDisplayNumber(
                            position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price,
                            { significantDigits: 6 },
                          )}{' '}
                          {position.pool.tokenAmounts[1]?.token.symbol || ''}
                        </Text>
                      </>
                    }
                    width="fit-content"
                    placement="bottom"
                  >
                    <Text>
                      {formatDisplayNumber(
                        position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0),
                        { style: 'currency', significantDigits: 4 },
                      )}
                    </Text>
                  </MouseoverTooltip>
                </PositionValueWrapper>
                <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                  <PositionValueLabel>Bal</PositionValueLabel>
                  <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                    <Text>
                      {formatDisplayNumber(
                        position.currentAmounts[0]?.quotes.usd.value / position.currentAmounts[0]?.quotes.usd.price,
                        { significantDigits: 4 },
                      )}{' '}
                      {position.pool.tokenAmounts[0]?.token.symbol || ''}
                    </Text>
                    {upToSmall && <Divider />}
                    <Text>
                      {formatDisplayNumber(
                        position.currentAmounts[1]?.quotes.usd.value / position.currentAmounts[1]?.quotes.usd.price,
                        { significantDigits: 4 },
                      )}{' '}
                      {position.pool.tokenAmounts[1]?.token.symbol || ''}
                    </Text>
                  </Flex>
                </PositionValueWrapper>
                {(upToSmall || !upToLarge) && (
                  <Flex alignItems={'center'} justifyContent={'flex-end'} sx={{ gap: '16px' }}>
                    <MouseoverTooltip
                      text="Remove liquidity from this position by zapping out to any token(s) or migrating to another position."
                      placement="top"
                    >
                      <PositionAction>
                        <Minus size={16} />
                      </PositionAction>
                    </MouseoverTooltip>
                    <MouseoverTooltip
                      text="Add more liquidity to this position using any token(s) or migrate liquidity from your existing positions."
                      placement="top"
                    >
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
                    </MouseoverTooltip>
                  </Flex>
                )}
              </PositionRow>
            ))
          ) : (
            <EmptyPositionText>You haven&apos;t had any positions yet!</EmptyPositionText>
          )}
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
