import { useActiveWeb3React } from 'hooks'
import { ChainId, Fraction, JSBI, Token } from '@dynamic-amm/sdk'
import { feeRangeCalc, getMyLiquidity, getTradingFeeAPR, priceRangeCalcByPair, useCheckIsFarmingPool } from 'utils/dmm'
import { formattedNum, shortenAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { MouseoverTooltip } from 'components/Tooltip'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import { t, Trans } from '@lingui/macro'
import CopyHelper from 'components/Copy'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { Link } from 'react-router-dom'
import { currencyId } from 'utils/currencyId'
import AddCircle from 'components/Icons/AddCircle'
import MinusCircle from 'components/Icons/MinusCircle'
import Loader from 'components/Loader'
import InfoHelper from 'components/InfoHelper'
import { AMP_HINT, MAX_ALLOW_APY } from 'constants/index'
import React from 'react'
import { ListItemProps } from 'components/PoolList/ListItem'
import {
  APR,
  DataText,
  DataTitle,
  GridItem,
  PoolAddressContainer,
  StyledItemCard,
  TradeButtonText,
  TradeButtonWrapper
} from 'components/PoolList/styled'

const ItemCard = ({ poolData, myLiquidity }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(10000))

  const realPercentToken0 = poolData
    ? new Fraction(poolData.reserve0)
        .divide(poolData.vReserve0)
        .multiply('100')
        .divide(
          new Fraction(poolData.reserve0)
            .divide(poolData.vReserve0)
            .add(new Fraction(poolData.reserve1).divide(poolData.vReserve1))
        )
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(3)
  const percentToken1 = realPercentToken1.toSignificant(3)

  const isFarmingPool = useCheckIsFarmingPool(poolData.id)
  const isWarning = realPercentToken0.lessThan(JSBI.BigInt(10)) || realPercentToken1.lessThan(JSBI.BigInt(10))

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(poolData.id, 3)
  const token0 = new Token(
    chainId as ChainId,
    poolData.token0.id,
    +poolData.token0.decimals,
    poolData.token0.symbol,
    poolData.token0.name
  )
  const token1 = new Token(
    chainId as ChainId,
    poolData.token1.id,
    +poolData.token1.decimals,
    poolData.token1.symbol,
    poolData.token1.name
  )
  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

  const volume = poolData?.oneDayVolumeUSD ? poolData?.oneDayVolumeUSD : poolData?.oneDayVolumeUntracked

  const fee = poolData?.oneDayFeeUSD ? poolData?.oneDayFeeUSD : poolData?.oneDayFeeUntracked

  const oneYearFL = getTradingFeeAPR(poolData?.reserveUSD, fee).toFixed(2)

  const totalValueLocked = formattedNum(`${parseFloat(poolData?.reserveUSD)}`, true)

  const formatPriceMin = (price?: Fraction) => {
    return price?.toSignificant(6) ?? '0'
  }

  const formatPriceMax = (price?: Fraction) => {
    return !price || price.equalTo(new Fraction('-1')) ? '♾️' : price.toSignificant(6)
  }

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
              text={t`Current token pair ratio of the poolData. Ratio changes depending on poolData trades. Add liquidity according to this ratio.`}
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
            {/*TODO: priceRange */}
            {/*{poolData.token0.symbol}/{poolData.token1.symbol}: {formatPriceMin(priceRangeCalcByPair(poolData)[0][0])} -{' '}*/}
            {/*{formatPriceMax(priceRangeCalcByPair(poolData)[0][1])}*/}
          </DataText>
          <DataText>
            {/*TODO: priceRange */}
            {/*{poolData.token1.symbol}/{poolData.token0.symbol}: {formatPriceMin(priceRangeCalcByPair(poolData)[1][0])} -{' '}*/}
            {/*{formatPriceMax(priceRangeCalcByPair(poolData)[1][1])}*/}
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
}

export default ItemCard
