import { useActiveWeb3React } from 'hooks'
import { ChainId, ETHER, Fraction, JSBI, Percent } from '@dynamic-amm/sdk'
import { feeRangeCalc, getMyLiquidity, getTradingFeeAPR, parseSubgraphPoolData, useCheckIsFarmingPool } from 'utils/dmm'
import { formattedNum, shortenAddress } from 'utils'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { t, Trans } from '@lingui/macro'
import CopyHelper from 'components/Copy'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { currencyId } from 'utils/currencyId'
import { AMP_LIQUIDITY_HINT, DMM_ANALYTICS_URL, MAX_ALLOW_APY, ONE_BIPS } from 'constants/index'
import React, { useState } from 'react'
import { ListItemGroupProps, ListItemProps } from 'components/PoolList/ListItem'
import { Flex, Text } from 'rebass'
import {
  ButtonGroupContainer,
  DashedDivider,
  FooterContainer,
  HeaderAMPAndAddress,
  HeaderContainer,
  HeaderLogo,
  HeaderTitle,
  InformationContainer,
  ItemCardGroupContainer,
  Progress,
  StyledItemCard,
  TabContainer,
  TabItem,
  TextShowMorePools,
  TokenRatioContainer,
  TokenRatioGrid,
  TokenRatioName,
  TokenRatioPercent
} from 'components/PoolList/styled'
import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import CurrencyLogo from 'components/CurrencyLogo'
import ItemCardInfoRow, { ItemCardInfoRowPriceRange } from 'components/PoolList/ItemCardInfoRow'
import { useMedia } from 'react-use'
import { ExternalLink } from 'theme'
import { tryParseAmount } from 'state/swap/hooks'
import { useFarmsData } from 'state/farms/hooks'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChevronDown, ChevronUp } from 'react-feather'

const TAB = {
  INFO: 0,
  DETAILS: 1,
  YOUR_LIQUIDITY: 2,
  YOUR_STAKED: 3
}

const SUBGRAPH_AMP_MULTIPLIER = 10000

export const ItemCardGroup = ({
  sortedFilteredSubgraphPoolsObject,
  poolData,
  userLiquidityPositions,
  expandedPoolKey,
  setExpandedPoolKey
}: ListItemGroupProps) => {
  const poolKey = poolData.token0.id + '-' + poolData.token1.id

  const isShowTwoPools = poolKey === expandedPoolKey

  const [isShowAllPools, setIsShowAllPools] = useState(false)

  const expandedPools = sortedFilteredSubgraphPoolsObject.get(poolKey) ?? []

  const renderPools = isShowTwoPools ? (isShowAllPools ? expandedPools : expandedPools.slice(0, 2)) : [poolData]

  const isDisableShowAllPools = expandedPools.length <= 1

  const onUpdateExpandedPoolKeyAndShowAllPools = () => {
    if (isDisableShowAllPools) return
    setExpandedPoolKey(prev => (prev === poolKey ? '' : poolKey))
    setIsShowAllPools(prev => !prev)
  }

  const { chainId } = useActiveWeb3React()

  const { currency0, currency1 } = parseSubgraphPoolData(poolData, chainId as ChainId)

  const theme = useTheme()

  return (
    <ItemCardGroupContainer>
      <Flex
        justifyContent="space-between"
        onClick={onUpdateExpandedPoolKeyAndShowAllPools}
        style={{ cursor: isDisableShowAllPools ? 'default' : 'pointer' }}
      >
        <Flex>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
          <Text fontSize="20px" fontWeight={500} lineHeight="24px">
            {poolData.token0.symbol} - {poolData.token1.symbol}
          </Text>
        </Flex>
        {isShowAllPools ? <ChevronUp /> : <ChevronDown color={isDisableShowAllPools ? theme.buttonGray : theme.text} />}
      </Flex>
      {renderPools.map((poolData, index) => (
        <ItemCard
          key={poolData.id}
          poolData={poolData}
          myLiquidity={userLiquidityPositions[poolData.id]}
          isShowExpandedPools={isShowTwoPools}
          isFirstPoolInGroup={index === 0}
          isDisableShowTwoPools={isDisableShowAllPools}
        />
      ))}
      {isShowAllPools && (
        <TextShowMorePools disabled={isDisableShowAllPools} onClick={onUpdateExpandedPoolKeyAndShowAllPools}>
          <Trans>
            Show less {poolData.token0.symbol} - {poolData.token1.symbol} pools
          </Trans>
        </TextShowMorePools>
      )}
      <DashedDivider />
    </ItemCardGroupContainer>
  )
}

const ItemCard = ({ poolData, myLiquidity }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))

  const isFarmingPool = useCheckIsFarmingPool(poolData.id)

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(poolData.id, 3)
  const {
    currency0,
    currency1,
    reserve0,
    virtualReserve0,
    reserve1,
    virtualReserve1,
    totalSupply
  } = parseSubgraphPoolData(poolData, chainId as ChainId)
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).add(reserve1.divide(virtualReserve1)))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const volume = poolData?.oneDayVolumeUSD ? poolData?.oneDayVolumeUSD : poolData?.oneDayVolumeUntracked

  const fee = poolData?.oneDayFeeUSD ? poolData?.oneDayFeeUSD : poolData?.oneDayFeeUntracked

  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  const totalValueLocked = formattedNum(`${parseFloat(poolData?.reserveUSD)}`, true)
  const oneYearFL = getTradingFeeAPR(poolData?.reserveUSD, fee).toFixed(2)

  const theme = useTheme()
  const above1000 = useMedia('(min-width: 1000px)')
  const [activeTabIndex, setActiveTabIndex] = useState(above1000 ? TAB.DETAILS : TAB.INFO)

  const farmData = useFarmsData()

  const TabInfoItems = () => (
    <>
      <ItemCardInfoRow name={t`Total Value Locked`} value={totalValueLocked as string} />
      <ItemCardInfoRow
        name={t`APR`}
        value={Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}
        infoHelperText={t`Estimated return based on yearly fees of the pool`}
      />
      <ItemCardInfoRow name={t`Volume (24H)`} value={volume} />
      <ItemCardInfoRow name={t`Fees (24H)`} value={fee} />
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
    </>
  )

  const TabDetailsItems = () => (
    <>
      <ItemCardInfoRow name={t`AMP Liquidity`} value={ampLiquidity as string} infoHelperText={AMP_LIQUIDITY_HINT} />
      <ItemCardInfoRowPriceRange poolData={poolData} />
      <ItemCardInfoRow name={t`Fee Range`} value={feeRangeCalc(+amp.toSignificant(5))} />
    </>
  )

  const liquidityTokenBalance = myLiquidity?.liquidityTokenBalance
    ? tryParseAmount(myLiquidity?.liquidityTokenBalance, ETHER)
    : undefined

  const pooledToken0 =
    liquidityTokenBalance && reserve0 && totalSupply
      ? liquidityTokenBalance.multiply(reserve0).divide(totalSupply)
      : undefined

  const pooledToken1 =
    liquidityTokenBalance && reserve1 && totalSupply
      ? liquidityTokenBalance.multiply(reserve1).divide(totalSupply)
      : undefined

  const yourShareOfPool =
    liquidityTokenBalance && totalSupply ? new Percent(liquidityTokenBalance.raw, totalSupply.raw) : undefined

  const TabYourLiquidityItems = () => (
    <>
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
      <ItemCardInfoRow
        name={t`Total LP Tokens`}
        value={liquidityTokenBalance ? liquidityTokenBalance.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Pooled ${poolData.token0.symbol}`}
        currency={currency0}
        value={pooledToken0 ? pooledToken0.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Pooled ${poolData.token1.symbol}`}
        currency={currency1}
        value={pooledToken1 ? pooledToken1.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Your Share Of Pool`}
        value={
          yourShareOfPool
            ? yourShareOfPool.equalTo('0')
              ? '0%'
              : yourShareOfPool.lessThan(ONE_BIPS)
              ? '<0.01%'
              : `${yourShareOfPool.toFixed(2)}%`
            : '-'
        }
      />
    </>
  )

  const userStakedData = Object.values(farmData.data)
    .flat()
    .filter(farm => farm.id.toLowerCase() === poolData.id)
    .map(farm => {
      const LP_TOKEN_DECIMALS = 18

      const userStakedBalance = farm.userData?.stakedBalance
        ? new Fraction(farm.userData.stakedBalance, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(LP_TOKEN_DECIMALS)))
        : new Fraction('0')

      const lpUserStakedTokenRatio = userStakedBalance.divide(
        new Fraction(
          ethers.utils.parseUnits(farm.totalSupply, LP_TOKEN_DECIMALS).toString(),
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(LP_TOKEN_DECIMALS))
        )
      )

      const userStakedToken0Balance = lpUserStakedTokenRatio.multiply(tryParseAmount(farm.reserve0, currency0) ?? '0')
      const userStakedToken1Balance = lpUserStakedTokenRatio.multiply(tryParseAmount(farm.reserve1, currency1) ?? '0')

      const RESERVE_USD_DECIMALS = 30
      const userStakedBalanceUSD = new Fraction(
        parseUnits(farm.reserveUSD, RESERVE_USD_DECIMALS).toString(),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS))
      ).multiply(lpUserStakedTokenRatio)

      return {
        userStakedToken0Balance,
        userStakedToken1Balance,
        userStakedBalanceUSD,
        userStakedBalance
      }
    })

  const {
    userStakedToken0Balance,
    userStakedToken1Balance,
    userStakedBalanceUSD,
    userStakedBalance
  } = userStakedData.reduce(
    (acc, value) => ({
      userStakedToken0Balance: acc.userStakedToken0Balance.add(value.userStakedToken0Balance),
      userStakedToken1Balance: acc.userStakedToken1Balance.add(value.userStakedToken1Balance),
      userStakedBalanceUSD: acc.userStakedBalanceUSD.add(value.userStakedBalanceUSD),
      userStakedBalance: acc.userStakedBalance.add(value.userStakedBalance)
    }),
    {
      userStakedToken0Balance: new Fraction('0'),
      userStakedToken1Balance: new Fraction('0'),
      userStakedBalanceUSD: new Fraction('0'),
      userStakedBalance: new Fraction('0')
    }
  )

  const TabYourStakedItems = () => {
    return (
      <>
        <ItemCardInfoRow name={t`Your Staked Balance`} value={'$' + userStakedBalanceUSD.toSignificant(3)} />
        <ItemCardInfoRow name={t`Staked LP Tokens`} value={userStakedBalance.toSignificant(3)} />
        <ItemCardInfoRow
          name={t`Staked ${poolData.token0.symbol}`}
          value={userStakedToken0Balance.toSignificant(3)}
          currency={currency0}
        />
        <ItemCardInfoRow
          name={t`Staked ${poolData.token1.symbol}`}
          value={userStakedToken1Balance.toSignificant(3)}
          currency={currency1}
        />
      </>
    )
  }

  return (
    <StyledItemCard>
      {isFarmingPool && (
        <div style={{ position: 'absolute', top: -3, left: -1 }}>
          <MouseoverTooltip text="Available for yield farming">
            <DropIcon width={48} height={48} />
          </MouseoverTooltip>
        </div>
      )}
      {isWarning && (
        <div style={{ position: 'absolute', top: -3, left: -1 }}>
          <MouseoverTooltip text="One token is close to 0% in the poolData ratio. Pool might go inactive.">
            <WarningLeftIcon width={48} height={48} />
          </MouseoverTooltip>
        </div>
      )}
      {above1000 ? (
        <HeaderContainer>
          <HeaderTitle>
            {poolData.token0.symbol} - {poolData.token1.symbol}
          </HeaderTitle>
          <HeaderAMPAndAddress>
            <span>AMP = {formattedNum(amp.toSignificant(5))}</span>
            <span>|</span>
            <span>{shortenPoolAddress}</span>
            <CopyHelper toCopy={poolData.id} />
          </HeaderAMPAndAddress>
          <HeaderLogo>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={40} />
          </HeaderLogo>
        </HeaderContainer>
      ) : (
        <Flex flexDirection="column" alignItems="center" style={{ gap: '4px' }}>
          <Flex style={{ gap: '4px' }}>
            <Text fontSize="16px" fontWeight={400} lineHeight="16px">
              {shortenPoolAddress}
            </Text>
            <CopyHelper toCopy={poolData.id} margin="0" />
          </Flex>
          <Text color={theme.subText} fontSize="12px" fontWeight={400} lineHeight="16px">
            AMP = {formattedNum(amp.toSignificant(5))}
          </Text>
        </Flex>
      )}
      <TokenRatioContainer>
        <Progress value={percentToken0} />
        <TokenRatioGrid>
          <CurrencyLogo currency={currency0} size="32px" />
          <Flex flexDirection="column">
            <TokenRatioName>{poolData.token0.symbol}</TokenRatioName>
            <TokenRatioPercent>{percentToken0}%</TokenRatioPercent>
          </Flex>
          <Flex flexDirection="column" alignItems="flex-end">
            <TokenRatioName>{poolData.token1.symbol}</TokenRatioName>
            <TokenRatioPercent>{percentToken1}%</TokenRatioPercent>
          </Flex>
          <CurrencyLogo currency={currency1} size="32px" />
        </TokenRatioGrid>
      </TokenRatioContainer>
      <TabContainer>
        {!above1000 && (
          <TabItem active={activeTabIndex === TAB.INFO} onClick={() => setActiveTabIndex(TAB.INFO)}>
            <Trans>Info</Trans>
          </TabItem>
        )}
        <TabItem active={activeTabIndex === TAB.DETAILS} onClick={() => setActiveTabIndex(TAB.DETAILS)}>
          <Trans>Details</Trans>
        </TabItem>
        <TabItem active={activeTabIndex === TAB.YOUR_LIQUIDITY} onClick={() => setActiveTabIndex(TAB.YOUR_LIQUIDITY)}>
          {above1000 ? <Trans>Your Liquidity</Trans> : <Trans>Liquidity</Trans>}
        </TabItem>
        {userStakedBalance.greaterThan('0') && (
          <TabItem active={activeTabIndex === TAB.YOUR_STAKED} onClick={() => setActiveTabIndex(TAB.YOUR_STAKED)}>
            {above1000 ? <Trans>Your Staked</Trans> : <Trans>Staked</Trans>}
          </TabItem>
        )}
      </TabContainer>
      <InformationContainer>
        {activeTabIndex === TAB.INFO && <TabInfoItems />}
        {activeTabIndex === TAB.DETAILS && <TabDetailsItems />}
        {activeTabIndex === TAB.YOUR_LIQUIDITY && <TabYourLiquidityItems />}
        {activeTabIndex === TAB.YOUR_STAKED && <TabYourStakedItems />}
      </InformationContainer>
      <ButtonGroupContainer>
        <ButtonPrimary
          as={Link}
          to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
          style={{
            padding: '10px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Add Liquidity
        </ButtonPrimary>
        <ButtonOutlined
          as={Link}
          to={`/swap?inputCurrency=${currencyId(currency0, chainId)}&outputCurrency=${currencyId(currency1, chainId)}`}
          style={{
            padding: '10px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Swap
        </ButtonOutlined>
      </ButtonGroupContainer>
      <Divider />
      <FooterContainer>
        <ExternalLink
          href={DMM_ANALYTICS_URL[chainId as ChainId] + '/pool/' + poolData.id}
          style={{ fontSize: '14px' }}
        >
          <Trans>Analytics ↗</Trans>
        </ExternalLink>
      </FooterContainer>
    </StyledItemCard>
  )
}

export default ItemCard
