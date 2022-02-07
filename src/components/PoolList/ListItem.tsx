import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { Info, Minus, MoreHorizontal, Plus } from 'react-feather'
import { useDispatch } from 'react-redux'
import { t, Trans } from '@lingui/macro'

import { Fraction, JSBI, Pair } from '@dynamic-amm/sdk'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import DropIcon from 'components/Icons/DropIcon'
import WarningLeftIcon from 'components/Icons/WarningLeftIcon'
import AddCircle from 'components/Icons/AddCircle'
import MinusCircle from 'components/Icons/MinusCircle'
import { MouseoverTooltip } from 'components/Tooltip'
import CopyHelper from 'components/Copy'
import { usePoolDetailModalToggle } from 'state/application/hooks'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum, shortenAddress } from 'utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { feeRangeCalc, getMyLiquidity, getTradingFeeAPR, priceRangeCalcByPair, useCheckIsFarmingPool } from 'utils/dmm'
import { setSelectedPool } from 'state/pools/actions'
import Loader from 'components/Loader'
import InfoHelper from 'components/InfoHelper'
import { useActiveWeb3React } from 'hooks'
import { AMP_HINT, MAX_ALLOW_APY } from 'constants/index'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'

const TableRow = styled.div<{ fade?: boolean; active?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme, active }) => (active ? theme.evenRow : theme.oddRow)};
  border: 1px solid transparent;

  &:hover {
    border: 1px solid #4a636f;
  }
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 24px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToXL`
    margin-bottom: 20px;
  `}
`

const GridItem = styled.div<{ noBorder?: boolean }>`
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

const TradeButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  grid-column: 1 / span 3;
`

const TradeButtonText = styled.span`
  font-size: 14px;
`

const DataTitle = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${({ theme }) => theme.text6};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
`

const StyledMoreHorizontal = styled(MoreHorizontal)`
  color: ${({ theme }) => theme.text9};
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const APR = styled(DataText)`
  color: ${({ theme }) => theme.apr};
`

const AddressAndAMPContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const AddressWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: baseline;
`

const TextAMP = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

const TokenPairContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TextTokenPair = styled.div``

const TextAMPLiquidity = styled.div``

const AMPLiquidityAndTVLContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TextTVL = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

interface ListItemProps {
  pool: Pair
  subgraphPoolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
  active?: boolean
}

export const ItemCard = ({ pool, subgraphPoolData, myLiquidity }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const realPercentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(3)
  const percentToken1 = realPercentToken1.toSignificant(3)

  const isFarmingPool = useCheckIsFarmingPool(pool.address, chainId)
  const isWarning = realPercentToken0.lessThan(JSBI.BigInt(10)) || realPercentToken1.lessThan(JSBI.BigInt(10))

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const volume = subgraphPoolData?.oneDayVolumeUSD
    ? subgraphPoolData?.oneDayVolumeUSD
    : subgraphPoolData?.oneDayVolumeUntracked

  const fee = subgraphPoolData?.oneDayFeeUSD ? subgraphPoolData?.oneDayFeeUSD : subgraphPoolData?.oneDayFeeUntracked

  const oneYearFL = getTradingFeeAPR(subgraphPoolData?.reserveUSD, fee).toFixed(2)

  const totalValueLocked = formattedNum(`${parseFloat(subgraphPoolData?.reserveUSD)}`, true)

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
          <MouseoverTooltip text="One token is close to 0% in the pool ratio. Pool might go inactive.">
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
              <CopyHelper toCopy={pool.address} />
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
                  to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pool.address}`}
                  width="fit-content"
                >
                  <AddCircle />
                </ButtonEmpty>
              }
              {getMyLiquidity(myLiquidity) !== '-' && (
                <ButtonEmpty
                  padding="0"
                  as={Link}
                  to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pool.address}`}
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
            <div>{!subgraphPoolData ? <Loader /> : totalValueLocked}</div>
          </DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <Trans>Volume (24h)</Trans>
          </DataTitle>
          <DataText>{!subgraphPoolData ? <Loader /> : formattedNum(volume, true)}</DataText>
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
            <div>{`• ${percentToken0}% ${pool.token0.symbol}`}</div>
            <div>{`• ${percentToken1}% ${pool.token1.symbol}`}</div>
          </DataText>
        </GridItem>

        <GridItem>
          <DataTitle>
            <Trans>Fee (24h)</Trans>
          </DataTitle>
          <DataText>{!subgraphPoolData ? <Loader /> : formattedNum(fee, true)}</DataText>
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
            <InfoHelper text={t`Estimated return based on yearly fees of the pool`} size={12} />
          </DataTitle>

          <APR>{!subgraphPoolData ? <Loader /> : `${Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}`}</APR>
        </GridItem>

        <GridItem noBorder style={{ gridColumn: '1 / span 2' }}>
          <DataTitle>
            <Trans>Price Range</Trans>
          </DataTitle>
          <DataText>
            {pool.token0.symbol}/{pool.token1.symbol}: {formatPriceMin(priceRangeCalcByPair(pool)[0][0])} -{' '}
            {formatPriceMax(priceRangeCalcByPair(pool)[0][1])}
          </DataText>
          <DataText>
            {pool.token1.symbol}/{pool.token0.symbol}: {formatPriceMin(priceRangeCalcByPair(pool)[1][0])} -{' '}
            {formatPriceMax(priceRangeCalcByPair(pool)[1][1])}
          </DataText>
        </GridItem>
        <GridItem noBorder>
          <DataTitle>
            <Trans>Fee Range</Trans>
          </DataTitle>
          <DataText>
            {feeRangeCalc(!!pool?.amp ? +new Fraction(pool.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp)}
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

const ListItem = ({ pool, subgraphPoolData, myLiquidity, active }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const togglePoolDetailModal = usePoolDetailModalToggle()

  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const realPercentToken0 = pool
    ? pool.reserve0
        .divide(pool.virtualReserve0)
        .multiply('100')
        .divide(pool.reserve0.divide(pool.virtualReserve0).add(pool.reserve1.divide(pool.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(3)
  const percentToken1 = realPercentToken1.toSignificant(3)

  const isFarmingPool = useCheckIsFarmingPool(pool.address, chainId)
  const isWarning = realPercentToken0.lessThan(JSBI.BigInt(10)) || realPercentToken1.lessThan(JSBI.BigInt(10))

  // Shorten address with 0x + 3 characters at start and end
  const shortenPoolAddress = shortenAddress(pool?.liquidityToken.address, 3)
  const currency0 = unwrappedToken(pool.token0)
  const currency1 = unwrappedToken(pool.token1)

  const volume = subgraphPoolData?.oneDayVolumeUSD
    ? subgraphPoolData?.oneDayVolumeUSD
    : subgraphPoolData?.oneDayVolumeUntracked

  const fee = subgraphPoolData?.oneDayFeeUSD ? subgraphPoolData?.oneDayFeeUSD : subgraphPoolData?.oneDayFeeUntracked

  const oneYearFL = getTradingFeeAPR(subgraphPoolData?.reserveUSD, fee).toFixed(2)

  const ampLiquidity = formattedNum(
    `${parseFloat(amp.toSignificant(5)) * parseFloat(subgraphPoolData?.reserveUSD)}`,
    true
  )
  const totalValueLocked = formattedNum(`${parseFloat(subgraphPoolData?.reserveUSD)}`, true)

  const handleShowMore = () => {
    dispatch(
      setSelectedPool({
        pool,
        subgraphPoolData,
        myLiquidity
      })
    )
    togglePoolDetailModal()
  }

  const theme = useTheme()

  return (
    <TableRow active={active}>
      <DataText>
        <TokenPairContainer>
          <DoubleCurrencyLogo currency0={pool.token0} currency1={pool.token1} />
          <TextTokenPair>
            {pool.token0.symbol} - {pool.token1.symbol}
          </TextTokenPair>
        </TokenPairContainer>
      </DataText>
      <DataText style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '-22px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {isFarmingPool && (
            <div style={{ overflow: 'hidden', borderTopLeftRadius: '8px' }}>
              <MouseoverTooltip text={t`Available for yield farming`}>
                <DropIcon />
              </MouseoverTooltip>
            </div>
          )}
          {isWarning && (
            <div style={{ overflow: 'hidden', borderTopLeftRadius: '8px' }}>
              <MouseoverTooltip text={`One token is close to 0% in the pool ratio. Pool might go inactive.`}>
                <WarningLeftIcon />
              </MouseoverTooltip>
            </div>
          )}
        </div>
        <PoolAddressContainer>
          <AddressAndAMPContainer>
            <AddressWrapper>
              {shortenPoolAddress}
              <CopyHelper toCopy={pool.address} />
            </AddressWrapper>
            <TextAMP>AMP = {formattedNum(amp.toSignificant(5))}</TextAMP>
          </AddressAndAMPContainer>
        </PoolAddressContainer>
      </DataText>
      <DataText>
        {!subgraphPoolData ? (
          <Loader />
        ) : (
          <AMPLiquidityAndTVLContainer>
            <TextAMPLiquidity>{ampLiquidity}</TextAMPLiquidity>
            <TextTVL>{totalValueLocked}</TextTVL>
          </AMPLiquidityAndTVLContainer>
        )}
      </DataText>
      <APR>{!subgraphPoolData ? <Loader /> : `${Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}`}</APR>
      <DataText>{!subgraphPoolData ? <Loader /> : formattedNum(volume, true)}</DataText>
      <DataText>{!subgraphPoolData ? <Loader /> : formattedNum(fee, true)}</DataText>
      <DataText>{getMyLiquidity(myLiquidity)}</DataText>
      <ButtonWrapper>
        <ButtonEmpty
          padding="0"
          as={Link}
          to={`/add/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pool.address}`}
          style={{
            background: rgba(theme.primary, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Plus size={16} color={theme.primary} />
        </ButtonEmpty>
        {getMyLiquidity(myLiquidity) !== '-' && (
          <ButtonEmpty
            padding="0"
            as={Link}
            to={`/remove/${currencyId(currency0, chainId)}/${currencyId(currency1, chainId)}/${pool.address}`}
            style={{
              background: rgba(theme.subText, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px'
            }}
          >
            <Minus size={16} />
          </ButtonEmpty>
        )}

        <ButtonEmpty
          padding="0"
          onClick={handleShowMore}
          style={{
            background: rgba(theme.buttonGray, 0.2),
            minWidth: '28px',
            minHeight: '28px',
            width: '28px',
            height: '28px'
          }}
        >
          <Info size="16px" color={theme.subText} />
        </ButtonEmpty>
      </ButtonWrapper>
    </TableRow>
  )
}

export default ListItem
