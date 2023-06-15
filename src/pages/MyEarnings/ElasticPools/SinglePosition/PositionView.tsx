import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { ChevronsUp, Minus } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { TokenEarning } from 'services/earning'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { ActionButton } from 'pages/MyEarnings/ElasticPools/SinglePosition/ActionButton'
import CollectFeesPanel from 'pages/MyEarnings/ElasticPools/SinglePosition/CollectFeesPanel'
import CommonView, { CommonProps } from 'pages/MyEarnings/ElasticPools/SinglePosition/CommonView'
import PriceRangeChart from 'pages/MyEarnings/ElasticPools/SinglePosition/PriceRangeChart'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/ElasticPools/SinglePosition/styleds'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { useAppSelector } from 'state/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { isAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 8px;

    ${ActionButton} {
      padding: 8px;
      font-size: 11px;
    }
  `}
`

const ActionButtons = () => {
  return (
    <ActionButtonsWrapper>
      <ActionButton
        $variant="red"
        disabled={false}
        style={{
          flex: 1,
          gap: '4px',
        }}
      >
        <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
      </ActionButton>
      <ActionButton
        $variant="green"
        disabled={false}
        style={{
          flex: 1,
          gap: '4px',
        }}
      >
        <ChevronsUp size="16px" /> <Trans>Increase Liquidity</Trans>
      </ActionButton>
    </ActionButtonsWrapper>
  )
}

const PositionView: React.FC<CommonProps> = props => {
  const { positionEarning, position } = props
  const chainId = position.amount0.currency.chainId
  const liquidityValue0 = CurrencyAmount.fromRawAmount(unwrappedToken(position.pool.token0), position.amount0.quotient)
  const liquidityValue1 = CurrencyAmount.fromRawAmount(unwrappedToken(position.pool.token1), position.amount1.quotient)

  const token0 = unwrappedToken(position.pool.token0)
  const token1 = unwrappedToken(position.pool.token1)

  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)
  const isElasticLegacyPosition = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const { data: prices } = useTokenPricesWithLoading(
    [token0.wrapped.address || '', token1.wrapped.address || ''],
    chainId,
  )

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[token0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[token1.wrapped.address || '']

  const liquidityInUsdString = Number.isNaN(liquidityInUsd) ? '--' : formatUSDValue(liquidityInUsd, true)

  const feesEarnedToday: TokenEarning[] = positionEarning.historicalEarning?.[0].fees || EMPTY_ARRAY
  const feesEarnedTodayUSD = feesEarnedToday ? feesEarnedToday.reduce((sum, fee) => sum + Number(fee.amountUSD), 0) : 0

  const myStakedBalance = 0

  // TODO: check native token in pool
  const feesEarnedTokens = useMemo(() => {
    return feesEarnedToday
      ? feesEarnedToday
          .filter(fee => {
            const tokenAddress = isAddress(chainId, fee.token)
            if (!tokenAddress) {
              return false
            }

            const currency = tokensByChainId[chainId][tokenAddress]
            return !!currency
          })
          .map(fee => {
            const tokenAddress = isAddress(chainId, fee.token)
            const currency = tokensByChainId[chainId][String(tokenAddress)]

            return {
              logoUrl: currency.logoURI || '',
              amount: Number(fee.amountFloat),
              symbol: currency.symbol || 'NO SYMBOL',
            }
          })
      : []
  }, [chainId, feesEarnedToday, tokensByChainId])

  const farm = (
    <Link
      to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=elastic&type=active&search=${positionEarning.pool.id}`}
    >
      <Trans>farm</Trans>
    </Link>
  )

  return (
    <CommonView isEarningView={false} {...props}>
      <Column>
        <Row>
          <Label>
            <Trans>My Liquidity Balance</Trans>
          </Label>
          <Label $hasTooltip>
            <MouseoverTooltip width="fit-content" text={<Trans>Amount staked in a farm</Trans>} placement="top">
              <Trans>My Staked Balance</Trans>
            </MouseoverTooltip>
          </Label>
        </Row>

        <Row>
          {/* TODO: check if there're more than 10 tokens */}
          <HoverDropdown
            anchor={<Value>{liquidityInUsdString}</Value>}
            text={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={position.pool.token0} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={position.pool.token1} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                  </Text>
                </Flex>
              </>
            }
          />

          {myStakedBalance ? (
            <HoverDropdown
              anchor={<Value>--</Value>}
              disabled
              text={
                <Flex flexDirection="column" sx={{ gap: '8px' }} fontSize="14px">
                  hehe
                </Flex>
              }
            />
          ) : (
            <Value>--</Value>
          )}
        </Row>
      </Column>

      <Column>
        <Row>
          <Label>
            <Trans>My Pool APR</Trans>
          </Label>
          <Label $hasTooltip>
            <MouseoverTooltip
              text={<Trans>You can stake your liquidity in this farm to earn even more rewards. View the {farm}</Trans>}
              placement="top"
            >
              <Trans>My Farm APR</Trans>
            </MouseoverTooltip>
          </Label>
        </Row>
        <Row>
          <ValueAPR>--</ValueAPR>
          <ValueAPR>--</ValueAPR>
        </Row>
      </Column>

      <Flex
        sx={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <PriceRangeChart position={position} disabled={isElasticLegacyPosition} />

        <CollectFeesPanel
          feesEarnedTodayUSD={feesEarnedTodayUSD}
          feesEarnedTokens={feesEarnedTokens}
          // TODO: check disabled condition
          disabled={false}
        />

        <ActionButtons />
      </Flex>
    </CommonView>
  )
}

export default PositionView
