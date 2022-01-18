import { ChainId, Fraction, JSBI, Pair, Percent, TokenAmount } from '@dynamic-amm/sdk'
import { darken } from 'polished'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Text, Flex } from 'rebass'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { DMM_ANALYTICS_URL, ONE_BIPS } from 'constants/index'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, UppercaseText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonEmpty, ButtonPrimary, ButtonOutlined } from '../Button'
import Card, { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed, AutoRow } from '../Row'
import { useCurrencyConvertedToNative, checkIsFarmingPool, getTradingFeeAPR } from 'utils/dmm'
import { UserLiquidityPosition, useSinglePoolData } from 'state/pools/hooks'
import useTheme from 'hooks/useTheme'
import { TokenWrapper } from 'pages/AddLiquidity/styled'
import { useTokensPrice, useETHPrice } from 'state/application/hooks'
import { formattedNum, isAddress, shortenAddress } from 'utils'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { MouseoverTooltip } from 'components/Tooltip'
import Divider from 'components/Divider'
import DropIcon from 'components/Icons/DropIcon'
import InfoHelper from 'components/InfoHelper'
import CopyHelper from 'components/Copy'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)`
  border: none;
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 32px 20px 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 32px 16px;
  `}
`

const StyledMinimalPositionCard = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  border-radius: 4px;
  padding: 1rem;
  align-items: flex-start;
  gap: 1rem;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
    align-items: center;
    padding: 20px 24px;
    gap: 1rem;
  }
`

const MinimalPositionItem = styled(AutoColumn)<{ noBorder?: boolean; noPadding?: boolean }>`
  width: 100%;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px solid ${theme.border}`)};
  padding-bottom: ${({ noPadding }) => (noPadding ? '0' : '1rem')};

  @media only screen and (min-width: 1000px) {
    width: fit-content;
    border-bottom: none;
    border-right: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px solid ${theme.border}`)};
    padding-right: ${({ noPadding }) => (noPadding ? '0' : '1rem')};
    padding-bottom: 0;
  }
`

const IconWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

const TokenRatioText = styled(Text)<{ isWarning: boolean }>`
  color: ${({ theme, isWarning }) => (isWarning ? theme.warning : theme.text)};
`

const WarningMessage = styled(Text)`
  color: ${({ theme }) => theme.warning};
  text-align: center;
`

const formattedUSDPrice = (tokenAmount: TokenAmount, price: number) => {
  const usdValue = parseFloat(tokenAmount.toSignificant(6)) * price

  return <span>{`(~${formattedNum(usdValue.toString(), true)})`}</span>
}

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
  myLiquidity?: UserLiquidityPosition
}

export function NarrowPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance)
        ]
      : [undefined, undefined]

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)
  return (
    <>
      <StyledPositionCard border={border}>
        <AutoColumn gap="12px">
          <FixedHeightRow>
            <RowFixed>
              <Text fontWeight={500} fontSize={16}>
                <Trans>Your position</Trans>
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <FixedHeightRow onClick={() => setShowMore(!showMore)}>
            <RowFixed>
              <DoubleCurrencyLogo currency0={native0} currency1={native1} margin={true} size={20} />
              <Text fontWeight={500} fontSize={20}>
                {native0?.symbol}/{native1?.symbol}
              </Text>
            </RowFixed>
            <RowFixed>
              <Text fontWeight={500} fontSize={20}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}{' '}
              </Text>
            </RowFixed>
          </FixedHeightRow>
          <AutoColumn gap="4px">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                <Trans>Your pool share:</Trans>
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
              </Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                {native0?.symbol}:
              </Text>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                {native1?.symbol}:
              </Text>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
          </AutoColumn>
        </AutoColumn>
      </StyledPositionCard>
    </>
  )
}

export function MinimalPositionCard({ pair, showUnwrapped = false }: PositionCardProps) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance)
        ]
      : [undefined, undefined]

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  const usdPrices = useTokensPrice([pair.token0, pair.token1])

  return (
    <>
      <StyledMinimalPositionCard>
        <MinimalPositionItem style={{ height: '100%', alignItems: 'center', display: 'flex' }}>
          <Text fontWeight={500} fontSize={16}>
            <Trans>Your Current Position</Trans>
          </Text>
        </MinimalPositionItem>

        <MinimalPositionItem gap="4px">
          <RowFixed>
            <DoubleCurrencyLogo currency0={native0} currency1={native1} size={16} />
            <UppercaseText style={{ marginLeft: '4px' }}>
              <Text fontWeight={500} fontSize={12} color={theme.subText}>
                {native0?.symbol}/{native1?.symbol} LP Tokens
              </Text>
            </UppercaseText>
          </RowFixed>
          <RowFixed>
            <Text fontWeight={400} fontSize={14}>
              {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}{' '}
            </Text>
          </RowFixed>
        </MinimalPositionItem>

        <MinimalPositionItem>
          <AutoRow justify="space-evenly" style={{ gap: '1rem' }}>
            <MinimalPositionItem>
              <TokenWrapper>
                <CurrencyLogo currency={native0} size="16px" />
                <Text fontSize={12} fontWeight={500}>
                  {native0?.symbol}
                </Text>
              </TokenWrapper>

              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={400}>
                    {token0Deposited.equalTo('0')
                      ? '0'
                      : token0Deposited.lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                      ? '<0.01'
                      : token0Deposited?.toSignificant(6)}{' '}
                    {formattedUSDPrice(token0Deposited, usdPrices[0])}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </MinimalPositionItem>

            <MinimalPositionItem noBorder={true} noPadding={true}>
              <TokenWrapper>
                <CurrencyLogo currency={native1} size="16px" />
                <Text fontSize={12} fontWeight={500}>
                  {native1?.symbol}
                </Text>
              </TokenWrapper>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={14} fontWeight={400}>
                    {token1Deposited.equalTo('0')
                      ? '0'
                      : token1Deposited.lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                      ? '<0.01'
                      : token1Deposited?.toSignificant(6)}{' '}
                    {formattedUSDPrice(token1Deposited, usdPrices[1])}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </MinimalPositionItem>
          </AutoRow>
        </MinimalPositionItem>

        <MinimalPositionItem gap="4px" noBorder={true} noPadding={true}>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <UppercaseText>
              <Trans>Your share of pool</Trans>
            </UppercaseText>
          </Text>
          <Text fontSize={14} fontWeight={400}>
            {poolTokenPercentage && poolTokenPercentage.greaterThan('0')
              ? poolTokenPercentage?.lessThan(ONE_BIPS)
                ? '<0.01'
                : poolTokenPercentage?.toFixed(2)
              : '0'}
            %
          </Text>
        </MinimalPositionItem>
      </StyledMinimalPositionCard>
    </>
  )
}

const Tabs = styled.div`
  border-radius: 999px;
  margin-top: 0.5rem;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  align-items: center;
`

const TabItem = styled.div<{ active: boolean }>`
  border-radius: 999px;
  background: ${({ theme, active }) => (active ? theme.primary : theme.buttonBlack)};
  color: ${({ theme, active }) => (active ? theme.textReverse : theme.subText)};
  flex: 1;
  text-align: center;
  cursor: pointer;
  padding: 6px;
  font-weight: 500;
  font-size: 12px;
`

const Row = styled(Flex)`
  justify-content: space-between;
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
  margin-top: 8px;
  font-size: 12px;
`

export default function FullPositionCard({ pair, border, stakedBalance, myLiquidity }: PositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

  const isFarmingPool = checkIsFarmingPool(isAddress(pair.address) || pair.address, chainId)

  const ethPrice = useETHPrice()

  const { data: poolData } = useSinglePoolData(pair.address.toLowerCase(), ethPrice.currentPrice)

  const volume = poolData?.oneDayVolumeUSD || poolData?.oneDayVolumeUntracked
  const fee = poolData?.oneDayFeeUSD || poolData?.oneDayFeeUntracked
  const apr = getTradingFeeAPR(poolData?.reserveUSD, fee).toFixed(2)

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance)
        ]
      : [undefined, undefined]

  const [token0Staked, token1Staked] =
    !!pair &&
    !!totalPoolTokens &&
    !!stakedBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, stakedBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, stakedBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, stakedBalance)
        ]
      : [undefined, undefined]

  const amp = new Fraction(pair.amp).divide(JSBI.BigInt(10000))

  const percentToken0 = pair.reserve0
    .divide(pair.virtualReserve0)
    .multiply('100')
    .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
  const percentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0)

  const usdValue = myLiquidity
    ? (parseFloat(myLiquidity.liquidityTokenBalance) * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const stakedUSD = myLiquidity
    ? (parseFloat(stakedBalance?.toExact() || '0') * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const totalDeposit = formattedNum((usdValue + stakedUSD).toString(), true)

  const isWarning = percentToken0.lessThan(JSBI.BigInt(10)) || percentToken1.lessThan(JSBI.BigInt(10))

  const warningToken = isWarning
    ? percentToken0.lessThan(JSBI.BigInt(10))
      ? pair.token0.symbol
      : pair.token1.symbol
    : undefined

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  const theme = useTheme()
  const [activeTab, setActiveTab] = useState('available')

  return (
    <StyledPositionCard border={border}>
      {(isWarning || isFarmingPool) && (
        <IconWrapper>
          {isFarmingPool ? (
            <MouseoverTooltip text="Available for yield farming">
              <DropIcon width={40} height={40} />
            </MouseoverTooltip>
          ) : (
            <MouseoverTooltip
              text={
                warningToken ? (
                  <WarningMessage>{t`Note: ${warningToken} is now <10% of the pool. Pool might become inactive if ${warningToken} reaches 0%`}</WarningMessage>
                ) : (
                  <WarningMessage>
                    <Trans>One token is close to 0% in the pool ratio. Pool might go inactive.</Trans>
                  </WarningMessage>
                )
              }
            >
              <WarningLeftIcon width={40} height={40} />
            </MouseoverTooltip>
          )}
        </IconWrapper>
      )}

      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center">
          <DoubleCurrencyLogo currency0={native0} currency1={native1} size={24} />
          <Text fontWeight={500}>{`${native0?.symbol}/${native1?.symbol}`}</Text>
        </Flex>
        <Flex alignItems="center">
          <Text>{shortenAddress(pair.address, 3)}</Text>
          <CopyHelper toCopy={pair.address} margin="0" />
        </Flex>
      </Flex>

      <Flex marginTop="0.25rem" justifyContent="flex-end" alignItems="center">
        <Text color={theme.subText} fontWeight={500} marginLeft="4px" fontSize="12px">
          AMP = {amp.toSignificant(5)}
        </Text>
      </Flex>

      <Tabs>
        <TabItem active={activeTab === 'info'} onClick={() => setActiveTab('info')} role="button">
          <Trans>Pool Info</Trans>
        </TabItem>
        <TabItem active={activeTab === 'available'} onClick={() => setActiveTab('available')} role="button">
          <Trans>Your Liquidity</Trans>
        </TabItem>
        {stakedBalance && (
          <TabItem active={activeTab === 'staked'} onClick={() => setActiveTab('staked')}>
            <Trans>Your Staked</Trans>
          </TabItem>
        )}
      </Tabs>

      <Flex height="108px" marginTop="1rem" flexDirection="column" justifyContent="space-between">
        {activeTab === 'info' ? (
          <>
            <Row>
              <Trans>Total Value Locked</Trans>
              <Text color={theme.text} fontSize={14}>
                {myLiquidity ? formattedNum(myLiquidity?.pool.reserveUSD, true) : '-'}
              </Text>
            </Row>

            <Row>
              <Flex>
                <Trans>Ratio</Trans>
                <InfoHelper
                  size={14}
                  text={t`Current token pair ratio of the pool. Ratio changes depending on pool trades. Add liquidity according to this ratio.`}
                />
              </Flex>
              <TokenRatioText fontSize={14} fontWeight={500} isWarning={isWarning}>
                {percentToken0.toSignificant(2) ?? '.'}% {pair.token0.symbol} - {percentToken1.toSignificant(2) ?? '.'}%{' '}
                {pair.token1.symbol}
              </TokenRatioText>
            </Row>
            <Row>
              <Flex>
                <Trans>APR</Trans>
                <InfoHelper size={14} text={t`Estimated return based on yearly fees of the pool`} />
              </Flex>
              <Text fontSize={14} color={theme.apr}>
                {apr ? `${apr}%` : '-'}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Volume (24H)</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {volume ? formattedNum(volume, true) : '-'}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Fees (24H)</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {fee ? formattedNum(fee, true) : '-'}
              </Text>
            </Row>
          </>
        ) : activeTab === 'available' ? (
          <>
            <Row>
              <Text>
                <Trans>Your deposit</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {totalDeposit}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Total LP Tokens</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {userPoolBalance?.toSignificant(6) ?? '-'}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Pooled {native0?.symbol}</Trans>
              </Text>
              {token0Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'} color={theme.text}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
            <Row>
              <Text>
                <Trans>Pooled {native1?.symbol}</Trans>
              </Text>
              {token1Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <Text color={theme.text} fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>

            <Row>
              <Text>
                <Trans>Your share of pool</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </Row>
          </>
        ) : (
          <>
            <Row>
              <Text>
                <Trans>Your Staked Balance</Trans>
              </Text>
              <Text fontSize={14} color={theme.text}>
                {formattedNum(stakedUSD.toString(), true)}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Staked LP Tokens</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {stakedBalance?.toSignificant(6) ?? '-'}
              </Text>
            </Row>
            <Row>
              <Text>
                <Trans>Staked {native0?.symbol}</Trans>
              </Text>
              {token0Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'} color={theme.text}>
                    {token0Staked?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
            <Row>
              <Text>
                <Trans>Staked {native1?.symbol}</Trans>
              </Text>
              {token1Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <Text color={theme.text} fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token1Staked?.toSignificant(6)}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </Row>
          </>
        )}
      </Flex>

      <Flex marginTop="20px" sx={{ gap: '1rem' }}>
        <ButtonPrimary
          padding="10px"
          style={{ fontSize: '14px', borderRadius: '4px' }}
          as={Link}
          to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
        >
          <Text width="max-content">
            <Trans>Add Liquidity</Trans>
          </Text>
        </ButtonPrimary>

        {!!usdValue && (
          <ButtonOutlined
            style={{
              padding: '10px',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            as={Link}
            to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pair.address}`}
          >
            <Text width="max-content">
              <Trans>Remove Liquidity</Trans>
            </Text>
          </ButtonOutlined>
        )}
      </Flex>

      <Divider sx={{ marginTop: '18px' }} />

      <Flex justifyContent="space-between" marginTop="16px" alignItems="center">
        <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0">
          <ExternalLink
            style={{ width: '100%', textAlign: 'center' }}
            href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/account/${account}`}
          >
            <Trans>Analytics ↗</Trans>
          </ExternalLink>
        </ButtonEmpty>
        {isFarmingPool && (
          <ButtonEmpty width="max-content" style={{ fontSize: '14px' }} padding="0" as={Link} to="/farms">
            <Trans>Go to farm ↗</Trans>
          </ButtonEmpty>
        )}
      </Flex>
    </StyledPositionCard>
  )
}
