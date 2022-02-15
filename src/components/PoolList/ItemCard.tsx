import { useActiveWeb3React } from 'hooks'
import { ChainId, Currency, ETHER, Fraction, JSBI } from '@dynamic-amm/sdk'
import {
  feeRangeCalc,
  getMyLiquidity,
  getTradingFeeAPR,
  parseSubgraphPoolData,
  priceRangeCalcBySubgraphPool,
  useCheckIsFarmingPool
} from 'utils/dmm'
import { formattedNum, shortenAddress } from 'utils'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { t, Trans } from '@lingui/macro'
import CopyHelper from 'components/Copy'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { currencyId } from 'utils/currencyId'
import AddCircle from 'components/Icons/AddCircle'
import MinusCircle from 'components/Icons/MinusCircle'
import Loader from 'components/Loader'
import InfoHelper from 'components/InfoHelper'
import { AMP_HINT, AMP_LIQUIDITY_HINT, DMM_ANALYTICS_URL, MAX_ALLOW_APY } from 'constants/index'
import React, { useState } from 'react'
import { ListItemProps } from 'components/PoolList/ListItem'
import { Box, Flex, Text } from 'rebass'
import {
  APR,
  DataText,
  DataTitle,
  GridItem,
  ButtonGroupContainer,
  FooterContainer,
  HeaderContainer,
  InformationContainer,
  TabContainer,
  TokenRatioContainer,
  PoolAddressContainer,
  StyledItemCard,
  TradeButtonText,
  TradeButtonWrapper,
  HeaderTitle,
  HeaderAMPAndAddress,
  HeaderLogo,
  TokenRatioName,
  TokenRatioPercent,
  Progress,
  TokenRatioGrid,
  TabItem
} from 'components/PoolList/styled'
import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import CurrencyLogo from 'components/CurrencyLogo'
import ItemCardInfoRow, { ItemCardInfoRowPriceRange } from 'components/PoolList/ItemCardInfoRow'
import { useMedia } from 'react-use'
import { Field } from 'state/pair/actions'
import { ExternalLink } from 'theme'

const TAB = {
  INFO: 0,
  DETAILS: 1,
  YOUR_LIQUIDITY: 2,
  YOUR_STAKED: 3
}

const ItemCard = ({ poolData, myLiquidity }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(10000))

  const isFarmingPool = useCheckIsFarmingPool(poolData.id)

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(poolData.id, 3)
  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1 } = parseSubgraphPoolData(
    poolData,
    chainId as ChainId
  )
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

  const formatPriceMin = (price?: Fraction) => {
    return price?.toSignificant(6) ?? '0'
  }

  const formatPriceMax = (price?: Fraction) => {
    return !price || price.equalTo(new Fraction('-1')) ? '♾️' : price.toSignificant(6)
  }

  const theme = useTheme()
  const above1000 = useMedia('(min-width: 1000px)')
  const [activeTabIndex, setActiveTabIndex] = useState(above1000 ? TAB.DETAILS : TAB.INFO)

  const TabInfoItems = () => (
    <>
      <ItemCardInfoRow name={t`Total Value Locked`} value={totalValueLocked as string} />
      <ItemCardInfoRow name={t`APR`} value={Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'} />
      <ItemCardInfoRow name={t`Volume (24H)`} value={volume} />
      <ItemCardInfoRow name={t`Fees (24H)`} value={fee} />
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity) as string} />
    </>
  )

  const TabDetailsItems = () => (
    <>
      <ItemCardInfoRow name={t`AMP Liquidity`} value={ampLiquidity as string} infoHelperText={AMP_LIQUIDITY_HINT} />
      <ItemCardInfoRowPriceRange poolData={poolData} />
      <ItemCardInfoRow
        name={t`Fee Range`}
        value={feeRangeCalc(
          !!poolData?.amp ? +new Fraction(poolData.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp
        )}
      />
    </>
  )

  const TabYourLiquidityItems = () => <></>

  const TabYourStakedItems = () => <></>

  return (
    <StyledItemCard>
      {isFarmingPool && (
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <MouseoverTooltip text="Available for yield farming">
            <DropIcon width={48} height={48} />
          </MouseoverTooltip>
        </div>
      )}
      <HeaderContainer>
        <HeaderTitle>
          {poolData.token0.symbol} - {poolData.token1.symbol}
        </HeaderTitle>
        <HeaderAMPAndAddress>
          <span>AMP = {poolData.amp}</span>
          <span>|</span>
          <span>{shortenPoolAddress}</span>
          <CopyHelper toCopy={poolData.id} />
        </HeaderAMPAndAddress>
        <HeaderLogo>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={40} />
        </HeaderLogo>
      </HeaderContainer>
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
          <Trans>Your Liquidity</Trans>
        </TabItem>
        <TabItem active={activeTabIndex === TAB.YOUR_STAKED} onClick={() => setActiveTabIndex(TAB.YOUR_STAKED)}>
          <Trans>Your Staked</Trans>
        </TabItem>
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
  /*
  return (
    <div>
      {isFarmingPool && (
        <div style={{ position: 'absolute' }}>
          <MouseoverTooltip text="Available for yield farming">
            <DropIcon />
          </MouseoverTooltip>
        </div>
      )}

      {isWarning && (
        <div style={{ position: 'absolute' }}>
          <MouseoverTooltip text="One token is close to 0% in the poolData ratio. Pool might go inactive.">
            <WarningLeftIcon />
          </MouseoverTooltip>
        </div>
      )}

      <StyledItemCard>
        <GridItem>
          <DataTitle>
            <Trans>Pool</Trans>
          </DataTitle>
          <DataText>
            <PoolAddressContainer>
              {shortenPoolAddress}
              <CopyHelper toCopy={poolData.id} />
            </PoolAddressContainer>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>
            <Trans>My liquidity</Trans>
          </DataTitle>
          <DataText>{getMyLiquidity(myLiquidity)}</DataText>
        </GridItem>

        <GridItem>
          <DataText style={{ alignItems: 'flex-end' }}>
            <PoolAddressContainer>
              {
                <ButtonEmpty
                  padding="0"
                  as={Link}
                  to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
                  width="fit-content"
                >
                  <AddCircle />
                </ButtonEmpty>
              }
              {getMyLiquidity(myLiquidity) !== '-' && (
                <ButtonEmpty
                  padding="0"
                  as={Link}
                  to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${poolData.id}`}
                  width="fit-content"
                >
                  <MinusCircle />
                </ButtonEmpty>
              )}
            </PoolAddressContainer>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>
            <span>
              <Trans>Total Value Locked</Trans>
            </span>
          </DataTitle>
          <DataText>
            <div>{!poolData ? <Loader /> : totalValueLocked}</div>
          </DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <Trans>Volume (24h)</Trans>
          </DataTitle>
          <DataText>{!poolData ? <Loader /> : formattedNum(volume, true)}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <span>
              <Trans>Ratio</Trans>
            </span>
            <InfoHelper
              text={t`Current token pair ratio of the pool. Ratio changes depending on pool trades. Add liquidity according to this ratio.`}
              size={12}
            />
          </DataTitle>
          <DataText>
            <div>{`• ${percentToken0}% ${poolData.token0.symbol}`}</div>
            <div>{`• ${percentToken1}% ${poolData.token1.symbol}`}</div>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>
            <Trans>Fee (24h)</Trans>
          </DataTitle>
          <DataText>{!poolData ? <Loader /> : formattedNum(fee, true)}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <span>
              <Trans>AMP</Trans>
            </span>
            <InfoHelper text={AMP_HINT} size={12} />
          </DataTitle>
          <DataText>{formattedNum(amp.toSignificant(5))}</DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <Trans>APR</Trans>
            <InfoHelper text={t`Estimated return based on yearly fees of the poolData`} size={12} />
          </DataTitle>

          <APR>{!poolData ? <Loader /> : `${Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}`}</APR>
        </GridItem>

        <GridItem noBorder style={{ gridColumn: '1 / span 2' }}>
          <DataTitle>
            <Trans>Price Range</Trans>
          </DataTitle>
          <DataText>
            {poolData.token0.symbol}/{poolData.token1.symbol}:{' '}
            {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[0][0])} -{' '}
            {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[0][1])}
          </DataText>
          <DataText>
            {poolData.token1.symbol}/{poolData.token0.symbol}:{' '}
            {formatPriceMin(priceRangeCalcBySubgraphPool(poolData)[1][0])} -{' '}
            {formatPriceMax(priceRangeCalcBySubgraphPool(poolData)[1][1])}
          </DataText>
        </GridItem>
        <GridItem noBorder>
          <DataTitle>
            <Trans>Fee Range</Trans>
          </DataTitle>
          <DataText>
            {feeRangeCalc(
              !!poolData?.amp ? +new Fraction(poolData.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp
            )}
          </DataText>
        </GridItem>

        <TradeButtonWrapper>
          <ButtonPrimary
            padding="8px 48px"
            as={Link}
            to={`/swap?inputCurrency=${currencyId(currency0, chainId)}&outputCurrency=${currencyId(
              currency1,
              chainId
            )}`}
            width="fit-content"
          >
            <TradeButtonText>
              <Trans>Trade</Trans>
            </TradeButtonText>
          </ButtonPrimary>
        </TradeButtonWrapper>
      </StyledItemCard>
    </div>
  )
  */
}

export default ItemCard
