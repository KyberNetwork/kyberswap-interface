import { ChainId, Fraction, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { transparentize } from 'polished'
import { useState } from 'react'
import { AlertTriangle, Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'

import { ReactComponent as BlinkIcon } from 'assets/svg/blink.svg'
import { ButtonLight, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import { MoneyBag, Swap as SwapIcon } from 'components/Icons'
import {
  Progress,
  ProgressWrapper,
  TokenRatioContainer,
  TokenRatioGrid,
  TokenRatioName,
  TokenRatioPercent,
} from 'components/PoolList/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import DMM_POOL_INTERFACE from 'constants/abis/dmmPool'
import { APP_PATHS, ONE_BIPS, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { ClassicPoolData, ClassicPosition } from 'hooks/pool/classic/type'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/Subgraph/styleds'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { currencyId } from 'utils/currencyId'
import { feeRangeCalc, parseClassicPoolData, priceRangeCalcBySubgraphPool } from 'utils/dmm'
import { formatDisplayNumber, parseFraction } from 'utils/numbers'

import { POOL_TIMEFRAME, poolTimeframeText } from '../../const'
import { Tag } from '../../styleds'
import { FeeTag, FlipCard, FlipCardBack, FlipCardFront } from './styleds'

const formatPriceMin = (price?: Fraction) => {
  return formatDisplayNumber(price, { style: 'currency', significantDigits: 4, mergeZeros: 2 })
}

const formatPriceMax = (price?: Fraction) => {
  return !price || price.equalTo(new Fraction('-1'))
    ? '♾️'
    : formatDisplayNumber(price, { style: 'currency', significantDigits: 4, mergeZeros: 2 })
}

const getMyLiquidity = (pool: ClassicPoolData): string => {
  const liquidityPosition = pool.positions?.[0]
  if (!liquidityPosition || parseFloat(pool.totalSupply) === 0) {
    return '-'
  }

  const myLiquidity =
    (parseFloat(liquidityPosition.liquidityTokenBalance) * parseFloat(pool.reserveUSD)) / parseFloat(pool.totalSupply)

  return formatDisplayNumber(myLiquidity, { style: 'currency', significantDigits: 4, allowDisplayZero: false })
}

const ItemCard = ({
  pool,
  timeframe,
  onShared,
}: {
  pool: ClassicPoolData
  timeframe: POOL_TIMEFRAME
  position: ClassicPosition
  onShared: (id: string) => void
}) => {
  const chainId = pool.chainId || ChainId.MAINNET
  const myLiquidity = pool.positions?.[0]
  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const [showDetail, setShowDetail] = useState(false)

  const isFarmingPool = !!pool.farmAPR
  const factories = useMultipleContractSingleData([pool.id], DMM_POOL_INTERFACE, 'factory')
  const isNewStaticFeePool =
    factories?.[0]?.result?.[0] === (NETWORKS_INFO[chainId] as EVMNetworkInfo).classic.static.factory

  const { currency0, currency1, reserve0, virtualReserve0, reserve1, virtualReserve1, totalSupply } =
    parseClassicPoolData(pool, chainId)
  const realPercentToken0 =
    reserve0 && virtualReserve0 && reserve1 && virtualReserve1
      ? reserve0.asFraction
          .divide(virtualReserve0)
          .multiply('100')
          .divide(reserve0.divide(virtualReserve0).asFraction.add(reserve1.divide(virtualReserve1).asFraction))
      : new Fraction('50')
  const realPercentToken1 = new Fraction('100').subtract(realPercentToken0)
  const isWarning = realPercentToken0.lessThan('10') || realPercentToken1.lessThan('10')

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const theme = useTheme()

  const ampLiquidity = formatDisplayNumber(amp.multiply(parseFraction(pool.reserveUSD)), {
    style: 'currency',
    significantDigits: 7,
    fractionDigits: 4,
  })
  const volume = pool.oneDayVolumeUSD ? pool.oneDayVolumeUSD : pool.oneDayVolumeUntracked
  const fee24H = pool.oneDayFeeUSD ? pool.oneDayFeeUSD : pool.oneDayFeeUntracked

  const liquidityTokenBalance =
    myLiquidity?.liquidityTokenBalance && chainId
      ? tryParseAmount(myLiquidity?.liquidityTokenBalance, NativeCurrencies[chainId])
      : undefined

  const yourShareOfPool =
    liquidityTokenBalance && totalSupply ? new Percent(liquidityTokenBalance.quotient, totalSupply.quotient) : undefined

  const pooledToken0 = yourShareOfPool && reserve0 ? reserve0.multiply(yourShareOfPool) : undefined
  const pooledToken1 = yourShareOfPool && reserve1 ? reserve1.multiply(yourShareOfPool) : undefined

  const isToken0WETH = pool.token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = pool.token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const nativeToken = NativeCurrencies[chainId]
  const token0Symbol = isToken0WETH ? nativeToken.symbol : pool.token0.symbol
  const token1Symbol = isToken1WETH ? nativeToken.symbol : pool.token1.symbol

  const poolTitle = (
    <Flex alignItems="center">
      <Flex alignItems="end">
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
        <img
          src={NETWORKS_INFO[chainId].icon}
          alt={NETWORKS_INFO[chainId].name}
          width={12}
          height={12}
          style={{
            marginLeft: '-12px',
            zIndex: 1,
          }}
        />
      </Flex>
      <Text fontSize="16px" fontWeight="500">
        {token0Symbol} - {token1Symbol}
      </Text>
      <FeeTag style={{ fontSize: '12px' }}>AMP {formatDisplayNumber(amp, { significantDigits: 5 })}</FeeTag>

      {isFarmingPool && (
        <MouseoverTooltip
          noArrow
          text={
            <Text>
              <Trans>
                Available for yield farming. Click{' '}
                <Link
                  to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=classic&type=active&search=${pool.id}`}
                >
                  here
                </Link>{' '}
                to go to the farm.
              </Trans>
            </Text>
          }
        >
          <IconWrapper style={{ marginLeft: '6px', background: theme.apr + '33', width: '20px', height: '20px' }}>
            <MoneyBag size={12} color={theme.apr} />
          </IconWrapper>
        </MouseoverTooltip>
      )}

      {isWarning && (
        <MouseoverTooltip text={`One of the tokens in the pool is close to 0%. Pool might become inactive soon.`}>
          <IconWrapper
            style={{
              background: theme.warning,
              marginLeft: '6px',
            }}
          >
            <AlertTriangle color={theme.textReverse} size={12} />
          </IconWrapper>
        </MouseoverTooltip>
      )}
    </Flex>
  )

  const buttonGroup = (
    <Flex marginTop="16px" justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
      <ButtonLight
        as={Link}
        padding="8px 16px"
        style={{
          border: 'none',
        }}
        to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(
          currency0,
          chainId,
        )}/${currencyId(currency1, chainId)}/${pool.id}`}
      >
        <Plus size={20} />
        <Text marginLeft="4px" fontSize="12px" fontWeight={500} lineHeight="20px">
          Add Liquidity
        </Text>
      </ButtonLight>
      <ButtonOutlined
        padding="8px 16px"
        sx={{
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: '20px',
        }}
        height="36px"
        onClick={() => setShowDetail(showDetail => !showDetail)}
      >
        <Text as="span" style={{ transform: 'rotate(90deg)' }} width={20} height={20}>
          <SwapIcon size={20} />
        </Text>
        <Text marginLeft="4px">
          <Trans>Pool Details</Trans>
        </Text>
      </ButtonOutlined>
    </Flex>
  )

  return (
    <FlipCard flip={showDetail}>
      {!showDetail && (
        <FlipCardFront>
          <Flex as="td" sx={{ gap: '8px' }} padding={0}>
            <Flex alignItems="center">
              <Flex alignItems="end">
                <CurrencyLogo
                  currency={isToken0WETH ? nativeToken : pool.token0}
                  size={'36px'}
                  style={{ borderRadius: '50%' }}
                />
                <CurrencyLogo
                  currency={isToken1WETH ? nativeToken : pool.token1}
                  size={'36px'}
                  style={{ marginLeft: '-6px', borderRadius: '50%' }}
                />
                <img
                  src={NETWORKS_INFO[chainId].icon}
                  alt={NETWORKS_INFO[chainId].name}
                  width={18}
                  height={18}
                  style={{
                    marginLeft: '-8px',
                    zIndex: 1,
                  }}
                />
              </Flex>
            </Flex>
            <Flex flexDirection="column" sx={{ gap: '4px' }}>
              <Flex alignItems="center" sx={{ gap: '8px' }}>
                <Text flex={1} maxWidth="fit-content">
                  <MouseoverTooltip
                    text={`${token0Symbol} - ${token1Symbol}`}
                    width="fit-content"
                    containerStyle={{ maxWidth: '100%' }}
                    placement="top"
                  >
                    <Text
                      fontSize={14}
                      fontWeight="500"
                      lineHeight="20px"
                      flex={1}
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {token0Symbol} - {token1Symbol}
                    </Text>
                  </MouseoverTooltip>
                </Text>
                <CopyHelper toCopy={pool.address} size={12} />
                <Flex
                  onClick={() => {
                    onShared(pool.address)
                  }}
                  sx={{
                    cursor: 'pointer',
                  }}
                  role="button"
                  color={theme.subText}
                >
                  <Share2 size="12px" color={theme.subText} />
                </Flex>
              </Flex>
              <Flex sx={{ gap: '4px' }}>
                <Tag backgroundColor={theme['o-blue-20']} color={theme['blue-500']}>
                  <Trans>Classic</Trans>
                </Tag>
                <Tag backgroundColor={theme['o-grey-20']} color={theme['o-white-white']}>
                  AMP {formatDisplayNumber(amp, { significantDigits: 5 })}
                </Tag>

                {isFarmingPool && (
                  <MouseoverTooltip placement="top" text={t`Available for yield farming`} width="fit-content">
                    <Link
                      to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=classic&type=active&search=${pool.id}`}
                    >
                      <IconWrapper
                        style={{ background: transparentize(0.7, theme.primary), height: '16px', padding: '1px 4px' }}
                      >
                        <MoneyBag size={12} color={theme.apr} />
                      </IconWrapper>
                    </Link>
                  </MouseoverTooltip>
                )}
              </Flex>
            </Flex>
          </Flex>
          <Text
            width="fit-content"
            lineHeight="16px"
            fontSize="12px"
            fontWeight="500"
            color={theme.subText}
            sx={{ borderBottom: `1px dashed ${theme.border}` }}
            marginTop="16px"
          >
            <MouseoverTooltip
              width="fit-content"
              placement="right"
              text={<APRTooltipContent farmAPR={pool.farmAPR ?? 0} poolAPR={pool.apr} />}
            >
              <Trans>APR</Trans>
            </MouseoverTooltip>
          </Text>

          <Flex alignItems="center" sx={{ gap: '8px' }} marginTop="4px">
            <Text fontSize="28px" fontWeight="500" color={theme.apr} lineHeight="32px">
              {formatDisplayNumber(((pool.farmAPR ?? 0) + pool.apr) / 100, {
                style: 'percent',
                fractionDigits: 2,
              })}
            </Text>
            {isFarmingPool && <BlinkIcon width={20} height={20} />}
          </Flex>

          <Flex
            justifyContent="space-between"
            color={theme.subText}
            fontSize="12px"
            fontWeight="500"
            marginTop="1rem"
            lineHeight="16px"
          >
            <Text>
              <Trans>Volume ({poolTimeframeText[timeframe]})</Trans>
            </Text>
            <Text>
              <Trans>Fees ({poolTimeframeText[timeframe]})</Trans>
            </Text>
          </Flex>

          <Flex
            justifyContent="space-between"
            fontSize="16px"
            fontWeight="500"
            marginTop="0.25rem"
            marginBottom="1rem"
            lineHeight="24px"
          >
            <Text>{formatDisplayNumber(volume, { style: 'currency', significantDigits: 5 })}</Text>
            <Text>{formatDisplayNumber(fee24H, { style: 'currency', significantDigits: 5 })}</Text>
          </Flex>

          <Divider />

          <Box
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
            color={theme.subText}
            fontSize="12px"
            fontWeight="500"
            marginTop="1rem"
            lineHeight="16px"
          >
            <Text>TVL</Text>
            <Text textAlign="center">AMP TVL</Text>
            <Text textAlign="end">My Liquidity</Text>
          </Box>

          <Box
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}
            fontSize="16px"
            fontWeight="500"
            marginTop="0.25rem"
            lineHeight="24px"
          >
            <Text>
              {formatDisplayNumber(pool.reserveUSD, { style: 'currency', significantDigits: 7, fractionDigits: 4 })}
            </Text>
            <Text textAlign="center">{ampLiquidity}</Text>
            <Text textAlign="end">{getMyLiquidity(pool)}</Text>
          </Box>

          {buttonGroup}
        </FlipCardFront>
      )}

      {showDetail && (
        <FlipCardBack>
          {poolTitle}
          <TokenRatioContainer>
            <ProgressWrapper>
              <Progress value={percentToken0} />
            </ProgressWrapper>
            <TokenRatioGrid>
              <CurrencyLogo currency={currency0} size="32px" />
              <Flex flexDirection="column">
                <TokenRatioName>{token0Symbol}</TokenRatioName>
                <TokenRatioPercent>{percentToken0}%</TokenRatioPercent>
              </Flex>
              <Flex flexDirection="column" alignItems="flex-end">
                <TokenRatioName>{token1Symbol}</TokenRatioName>
                <TokenRatioPercent>{percentToken1}%</TokenRatioPercent>
              </Flex>
              <CurrencyLogo currency={currency1} size="32px" />
            </TokenRatioGrid>
          </TokenRatioContainer>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>
              {token0Symbol}/{token1Symbol}
            </Text>
            <Text>
              {token1Symbol}/{token0Symbol}
            </Text>
          </Flex>

          <Flex
            justifyContent="space-between"
            fontSize="16px"
            fontWeight="500"
            marginTop="0.25rem"
            sx={{
              gap: '16px',
            }}
          >
            <Text>
              {formatPriceMin(priceRangeCalcBySubgraphPool(pool)[0][0])} -{' '}
              {formatPriceMax(priceRangeCalcBySubgraphPool(pool)[0][1])}
            </Text>
            <Text textAlign={'end'}>
              {formatPriceMin(priceRangeCalcBySubgraphPool(pool)[1][0])} -{' '}
              {formatPriceMax(priceRangeCalcBySubgraphPool(pool)[1][1])}
            </Text>
          </Flex>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>{pool.fee ? <Trans>Fee</Trans> : <Trans>Fee Range</Trans>}</Text>
            <Text>AMP Liquidity</Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>
              {pool.fee
                ? factories?.[0]?.result !== undefined
                  ? pool.fee / (isNewStaticFeePool ? 1000 : 100) + '%'
                  : '-'
                : feeRangeCalc(+amp.toSignificant(5))}
            </Text>
            <Text>{ampLiquidity}</Text>
          </Flex>

          <Flex justifyContent="space-between" color={theme.subText} fontSize="12px" fontWeight="500" marginTop="1rem">
            <Text>
              <Trans>My Share of Pool</Trans>
            </Text>
            <Text>
              <Trans>My Liquidity</Trans>
            </Text>
          </Flex>

          <Flex justifyContent="space-between" fontSize="16px" fontWeight="500" marginTop="0.25rem">
            <Text>
              {yourShareOfPool
                ? yourShareOfPool.equalTo('0')
                  ? '0%'
                  : yourShareOfPool.lessThan(ONE_BIPS)
                  ? '<0.01%'
                  : `${yourShareOfPool.toFixed(2)}%`
                : '-'}
            </Text>
            <Text>
              {myLiquidity ? (
                <HoverDropdown
                  padding="0"
                  content={getMyLiquidity(pool)}
                  style={{ height: '20px' }}
                  dropdownContent={
                    <Flex flexDirection="column" sx={{ gap: '8px' }} fontSize="14px">
                      <Flex alignItems="center" sx={{ gap: '4px' }}>
                        <CurrencyLogo currency={currency0} size="16px" />
                        {pooledToken0?.toSignificant(6)} {currency0.symbol}
                      </Flex>
                      <Flex alignItems="center" sx={{ gap: '4px' }}>
                        <CurrencyLogo currency={currency1} size="16px" />
                        {pooledToken1?.toSignificant(6)} {currency1.symbol}
                      </Flex>
                    </Flex>
                  }
                />
              ) : (
                '-'
              )}
            </Text>
          </Flex>

          {buttonGroup}
        </FlipCardBack>
      )}
    </FlipCard>
  )
}

export default ItemCard
