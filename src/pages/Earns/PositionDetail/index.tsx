import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  EarnSupportedProtocols,
  PositionStatus,
  earnSupportedProtocols,
  usePositionEarningStatisticsQuery,
  useUserPositionQuery,
} from 'services/krystalEarn'

import CopyHelper from 'components/Copy'
import { Swap as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

import { CurrencyRoundedImage, CurrencySecondImage } from '../PoolExplorer/styles'
import {
  Badge,
  BadgeType,
  ChainImage,
  DexImage,
  EmptyPositionText,
  ImageContainer,
  PositionOverview,
  PositionPageWrapper,
} from '../UserPositions/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import {
  DexInfo,
  IconArrowLeft,
  InfoLeftColumn,
  InfoRight,
  InfoRightColumn,
  InfoSection,
  InfoSectionFirstFormat,
  InfoSectionSecondFormat,
  MainSection,
  PositionAction,
  PositionActionWrapper,
  PositionDetailWrapper,
  RevertIconWrapper,
  VerticalDivider,
} from './styles'

const PositionDetail = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const firstLoading = useRef(false)

  const { account } = useActiveWeb3React()
  const { id } = useParams()
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()
  const { data: userPosition, isLoading } = useUserPositionQuery(
    { addresses: account || '', positionId: id },
    { skip: !account, pollingInterval: 15_000 },
  )
  const { data: positionEarningStatistics } = usePositionEarningStatisticsQuery(
    {
      tokenAddress: userPosition?.[0]?.tokenAddress || '',
      tokenId: userPosition?.[0]?.tokenId || '',
      chainId: userPosition?.[0]?.chainId || '',
    },
    { skip: !userPosition?.[0], pollingInterval: 15_000 },
  )

  const [revert, setRevert] = useState(false)

  const position = useMemo(() => {
    if (!userPosition?.[0]) return
    const position = userPosition?.[0]

    return {
      id: position?.tokenId,
      dex: position?.pool.project || '',
      dexImage: position?.pool.projectLogo || '',
      chainId: position?.chainId,
      chainName: position?.chainName,
      chainLogo: position?.chainLogo || '',
      poolAddress: position?.pool.poolAddress || '',
      token0Logo: position?.pool.tokenAmounts[0]?.token.logo || '',
      token1Logo: position?.pool.tokenAmounts[1]?.token.logo || '',
      token0Symbol: position?.pool.tokenAmounts[0]?.token.symbol || '',
      token1Symbol: position?.pool.tokenAmounts[1]?.token.symbol || '',
      poolFee: position?.pool.fees?.[0],
      status: position?.status,
      totalValue: position?.currentPositionValue,
      apr: position?.apr || 0,
      token0TotalAmount: position
        ? position?.currentAmounts[0]?.quotes.usd.value / position?.currentAmounts[0]?.quotes.usd.price
        : 0,
      token1TotalAmount: position
        ? position?.currentAmounts[1]?.quotes.usd.value / position?.currentAmounts[1]?.quotes.usd.price
        : 0,
      minPrice: position?.minPrice || 0,
      maxPrice: position?.maxPrice || 0,
      pairRate: position?.pool.price || 0,
      totalUnclaimedFee:
        (position?.feePending?.[0].quotes.usd.value || 0) + (position?.feePending?.[1].quotes.usd.value || 0),
      token0UnclaimedAmount: position
        ? position.feePending[0]?.quotes.usd.value / position.feePending[0]?.quotes.usd.price
        : 0,
      token1UnclaimedAmount: position
        ? position.feePending[1]?.quotes.usd.value / position.feePending[1]?.quotes.usd.price
        : 0,
      token0UnclaimedValue: position?.feePending[0]?.quotes.usd.value,
      token1UnclaimedValue: position?.feePending[1]?.quotes.usd.value,
      totalEarnedFee: position
        ? position.feePending.reduce((a, b) => a + b.quotes.usd.value, 0) +
          position.feesClaimed.reduce((a, b) => a + b.quotes.usd.value, 0)
        : 0,
    }
  }, [userPosition])

  const earning = useMemo(() => {
    if (!positionEarningStatistics || !positionEarningStatistics.length) return {}

    const reversedPositionEarningStatistics = [...positionEarningStatistics].reverse()
    const earning24h = reversedPositionEarningStatistics[0].totalEarning
    const earning7d = reversedPositionEarningStatistics.slice(0, 7).reduce((a, b) => a + b.totalEarning, 0)

    return {
      earning24h,
      earning7d,
    }
  }, [positionEarningStatistics])

  const onOpenPositionInDexSite = () => {
    if (!position || !earnSupportedProtocols.includes(position.dex)) return

    if (position.dex === EarnSupportedProtocols.UNISWAP_V3)
      window.open(`https://app.uniswap.org/positions/v3/${position.chainName}/${position.id}`)
    else if (position.dex === EarnSupportedProtocols.SUSHISWAP_V3)
      window.open(`https://www.sushi.com/${position.chainName}/pool/v3/${position.poolAddress}/${position.id}`)
    else if (position.dex === EarnSupportedProtocols.PANCAKESWAP_V3)
      window.open(`https://pancakeswap.finance/liquidity/${position.id}`)
  }

  const onOpenIncreaseLiquidityWidget = () => {
    if (!position) return
    handleOpenZapInWidget(
      {
        exchange: position.dex,
        chainId: position.chainId,
        address: position.poolAddress,
      },
      position.id,
    )
  }

  useEffect(() => {
    if (!firstLoading.current && !isLoading) {
      firstLoading.current = true
    }
  }, [isLoading])

  return (
    <>
      {liquidityWidget}
      <PositionPageWrapper>
        {isLoading && !firstLoading.current ? (
          <LocalLoader />
        ) : position && Object.keys(position).length > 0 ? (
          <>
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
                    #24654
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
            <PositionDetailWrapper>
              <MainSection>
                <InfoLeftColumn>
                  <InfoSectionFirstFormat>
                    <Text fontSize={14} color={theme.subText} marginTop={1}>
                      {t`Total Liquidity`}
                    </Text>
                    <InfoRight>
                      <Text fontSize={20}>
                        {formatDisplayNumber(position.totalValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </Text>
                      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                        <DexImage src={position.token0Logo} />
                        <Text>{formatDisplayNumber(position.token0TotalAmount, { significantDigits: 6 })}</Text>
                        <Text>{position.token0Symbol}</Text>
                      </Flex>
                      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                        <DexImage src={position.token1Logo} />
                        <Text>{formatDisplayNumber(position.token1TotalAmount, { significantDigits: 6 })}</Text>
                        <Text>{position.token1Symbol}</Text>
                      </Flex>
                    </InfoRight>
                  </InfoSectionFirstFormat>
                  <InfoSectionFirstFormat>
                    <Flex alignItems={'center'} sx={{ marginTop: 1 }}>
                      <Text fontSize={14} color={theme.subText}>
                        {t`Est. Position APR`}
                      </Text>
                      <InfoHelper text={t`Estimated 7 days APR`} placement="top" />
                    </Flex>
                    <Text fontSize={20} color={position.apr > 0 ? theme.primary : theme.text}>
                      {formatDisplayNumber(position.apr * 100, {
                        significantDigits: position.apr < 0.01 ? 2 : position.apr < 0.1 ? 3 : 4,
                      })}
                      %
                    </Text>
                  </InfoSectionFirstFormat>
                  <InfoSection>
                    <Text fontSize={14} color={theme.subText} marginBottom={3}>
                      {t`Fee Earn`}
                    </Text>
                    <Flex alignItems={'center'} justifyContent={'space-between'}>
                      <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                        <Text fontSize={14} color={theme.subText}>
                          1 {t`day`}
                        </Text>
                        <Text>
                          {formatDisplayNumber(earning.earning24h, { significantDigits: 4, style: 'currency' })}
                        </Text>
                      </Flex>
                      <VerticalDivider />
                      <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                        <Text fontSize={14} color={theme.subText}>
                          7 {t`days`}
                        </Text>
                        <Text>
                          {formatDisplayNumber(earning.earning7d, { significantDigits: 4, style: 'currency' })}
                        </Text>
                      </Flex>
                      <VerticalDivider />
                      <Flex flexDirection={'column'} sx={{ gap: 2 }}>
                        <Text fontSize={14} color={theme.subText}>
                          {t`All`}
                        </Text>
                        <Text fontSize={18} color={position.totalEarnedFee ? theme.primary : theme.text}>
                          {formatDisplayNumber(position.totalEarnedFee, { style: 'currency', significantDigits: 4 })}
                        </Text>
                      </Flex>
                    </Flex>
                  </InfoSection>
                  <InfoSectionFirstFormat>
                    <Text fontSize={14} color={theme.subText} marginTop={1}>
                      {t`Total Unclaimed Fee`}
                    </Text>
                    <InfoRight>
                      <Text fontSize={20}>
                        {formatDisplayNumber(position.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
                      </Text>
                      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                        <Text>{formatDisplayNumber(position.token0UnclaimedAmount, { significantDigits: 4 })}</Text>
                        <Text>{position.token0Symbol}</Text>
                        <Text fontSize={14} color={theme.subText}>
                          {formatDisplayNumber(position.token0UnclaimedValue, {
                            style: 'currency',
                            significantDigits: 4,
                          })}
                        </Text>
                      </Flex>
                      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                        <Text>{formatDisplayNumber(position.token1UnclaimedAmount, { significantDigits: 4 })}</Text>
                        <Text>{position.token1Symbol}</Text>
                        <Text fontSize={14} color={theme.subText}>
                          {formatDisplayNumber(position.token1UnclaimedValue, {
                            style: 'currency',
                            significantDigits: 4,
                          })}
                        </Text>
                      </Flex>
                    </InfoRight>
                  </InfoSectionFirstFormat>
                </InfoLeftColumn>
                <InfoRightColumn>
                  <InfoSection>
                    <Flex alignItems={'center'} sx={{ gap: 1 }}>
                      <Text fontSize={14} color={theme.subText}>
                        {t`Current Price`}
                      </Text>
                      <Text fontSize={14}>
                        {formatDisplayNumber(!revert ? position.pairRate : 1 / position.pairRate, {
                          significantDigits: 6,
                        })}
                      </Text>
                      <Text fontSize={14} color={theme.subText}>
                        {!revert ? position.token0Symbol : position.token1Symbol} per{' '}
                        {!revert ? position.token1Symbol : position.token0Symbol}
                      </Text>
                      <RevertIconWrapper onClick={() => setRevert(!revert)}>
                        <SwapIcon rotate={90} size={18} />
                      </RevertIconWrapper>
                    </Flex>
                  </InfoSection>
                  <Flex sx={{ gap: '16px' }}>
                    <InfoSectionSecondFormat>
                      <Text fontSize={14} color={theme.subText}>
                        {t`Min Price`}
                      </Text>
                      <Text fontSize={18} marginBottom={2} marginTop={2}>
                        {formatDisplayNumber(!revert ? position.minPrice : 1 / position.maxPrice, {
                          significantDigits: 6,
                        })}
                      </Text>
                      <Text fontSize={14} color={theme.subText}>
                        {!revert ? position.token0Symbol : position.token1Symbol}/
                        {!revert ? position.token1Symbol : position.token0Symbol}
                      </Text>
                    </InfoSectionSecondFormat>
                    <InfoSectionSecondFormat>
                      <Text fontSize={14} color={theme.subText}>
                        {t`Max Price`}
                      </Text>
                      <Text fontSize={18} marginBottom={2} marginTop={2}>
                        {formatDisplayNumber(!revert ? position.maxPrice : 1 / position.minPrice, {
                          significantDigits: 6,
                        })}
                      </Text>
                      <Text fontSize={14} color={theme.subText}>
                        {!revert ? position.token0Symbol : position.token1Symbol}/
                        {!revert ? position.token1Symbol : position.token0Symbol}
                      </Text>
                    </InfoSectionSecondFormat>
                  </Flex>
                </InfoRightColumn>
              </MainSection>
              <PositionActionWrapper>
                <PositionAction outline>{t`Remove Liquidity`}</PositionAction>
                <PositionAction onClick={onOpenIncreaseLiquidityWidget}>{t`Add Liquidity`}</PositionAction>
              </PositionActionWrapper>
            </PositionDetailWrapper>
          </>
        ) : (
          <EmptyPositionText>{t`No position found`}</EmptyPositionText>
        )}
      </PositionPageWrapper>
    </>
  )
}

export default PositionDetail
