import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { ChevronsUp, Info, Minus, Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { PositionEarningWithDetails, TokenEarning } from 'services/earning'

import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { Wrapper } from 'pages/MyEarnings/SinglePosition'
import { ActionButton } from 'pages/MyEarnings/SinglePosition/ActionButton'
import CollectFeesPanel from 'pages/MyEarnings/SinglePosition/CollectFeesPanel'
import PriceRangeChart from 'pages/MyEarnings/SinglePosition/PriceRangeChart'
import { Column, Label, Row, Value, ValueAPR } from 'pages/MyEarnings/SinglePosition/styleds'
import { useAppSelector } from 'state/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { isAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

// TODO: merge with EarningView props
type Props = {
  onFlipView: () => void
  positionEarning: PositionEarningWithDetails
  position: Position
}
const PositionView: React.FC<Props> = ({ onFlipView, positionEarning, position }) => {
  const theme = useTheme()

  const chainId = position.amount0.currency.chainId
  const liquidityValue0 = CurrencyAmount.fromRawAmount(unwrappedToken(position.pool.token0), position.amount0.quotient)
  const liquidityValue1 = CurrencyAmount.fromRawAmount(unwrappedToken(position.pool.token1), position.amount1.quotient)

  const token0 = unwrappedToken(position.pool.token0)
  const token1 = unwrappedToken(position.pool.token1)

  const tokensByChainId = useAppSelector(state => state.lists.mapWhitelistTokens)

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
    <Wrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Text
            sx={{
              color: theme.primary,
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '20px',
            }}
          >
            #{positionEarning.id}
          </Text>

          <MouseoverTooltip
            text={
              <Trans>
                The price of this pool is within your selected range. Your position is currently earning fees
              </Trans>
            }
            placement="top"
          >
            <Flex
              sx={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                justifyContent: 'center',
                alignItems: 'center',
                background: rgba(theme.primary, 0.3),
              }}
            >
              <Info size={16} color={theme.primary} />
            </Flex>
          </MouseoverTooltip>
        </Flex>

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
                text={
                  <Trans>You can stake your liquidity in this farm to earn even more rewards. View the {farm}</Trans>
                }
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
          <PriceRangeChart position={position} />

          <CollectFeesPanel
            feesEarnedTodayUSD={feesEarnedTodayUSD}
            feesEarnedTokens={feesEarnedTokens}
            // TODO: check disabled condition
            disabled={false}
          />

          <Flex
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
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
          </Flex>
        </Flex>
      </Flex>

      <Flex
        role="button"
        onClick={onFlipView}
        justifyContent="center"
        alignItems="center"
        sx={{
          flex: '0 0 fit-content',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
          gap: '4px',
          cursor: 'pointer',
        }}
      >
        <Repeat size={12} />
        <Trans>View Earnings</Trans>
      </Flex>
    </Wrapper>
  )
}

export default PositionView
