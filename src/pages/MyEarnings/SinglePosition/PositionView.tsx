import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { ChevronsUp, Info, Minus, Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import { PositionEarningWithDetails } from 'services/earning'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Logo from 'components/Logo'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { Wrapper } from 'pages/MyEarnings/SinglePosition'
import { ActionButton } from 'pages/MyEarnings/SinglePosition/ActionButton'
import PriceRangeChart from 'pages/MyEarnings/SinglePosition/PriceRangeChart'
import { useAppSelector } from 'state/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { formattedNumLong, isAddress } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 4px 16px;
  justify-content: space-between;
`

const TextAPR = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  color: ${({ theme }) => theme.apr};
`

const Label = styled.span<{ $hasTooltip?: boolean }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};

  ${({ $hasTooltip, theme }) =>
    $hasTooltip
      ? css`
          text-decoration-line: underline;
          text-decoration-style: dashed;
          text-decoration-color: ${theme.subText};
        `
      : ''};
`

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

  const prices = useTokenPrices([token0.wrapped.address || '', token1.wrapped.address || ''])

  const liquidityInUsd =
    parseFloat(position.amount0.toExact() || '0') * prices[token0.wrapped.address || ''] +
    parseFloat(position.amount1.toExact() || '0') * prices[token1.wrapped.address || '']

  const liquidityInUsdString = Number.isNaN(liquidityInUsd) ? '--' : formatUSDValue(liquidityInUsd, true)

  const feesEarnedToday = positionEarning.historicalEarning[0].fees
  const feesEarnedTodayUSD = feesEarnedToday ? feesEarnedToday.reduce((sum, fee) => sum + Number(fee.amountUSD), 0) : 0

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
        </Flex>

        <GridWrapper>
          <Label>My Liquidity Balance</Label>
          <Label $hasTooltip>My Staked Balance</Label>

          {
            // TODO: check if there're more than 10 tokens
            position && (
              <HoverDropdown
                anchor={<span>{liquidityInUsdString}</span>}
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
            )
          }

          <HoverDropdown
            anchor={'$230,23K'}
            text={
              <Flex flexDirection="column" sx={{ gap: '8px' }} fontSize="14px">
                hehe
              </Flex>
            }
          />
        </GridWrapper>

        <GridWrapper>
          <Label>My Pool APR</Label>
          <Label $hasTooltip>My Farm APR</Label>

          <TextAPR>--</TextAPR>
          <TextAPR>--</TextAPR>
        </GridWrapper>

        <Flex
          sx={{
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
          }}
        >
          <PriceRangeChart position={position} />

          <Flex
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '20px',
              background: rgba(theme.apr, 0.3),
              padding: '16px',
            }}
          >
            <Flex
              sx={{
                flexDirection: 'column',
              }}
            >
              <Text
                as="span"
                sx={{
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: theme.subText,
                }}
              >
                <Trans>Fees Earned</Trans>
              </Text>
              <HoverDropdown
                anchor={formatUSDValue(feesEarnedTodayUSD, true)}
                disabled={!feesEarnedTokens.length}
                text={
                  <>
                    {feesEarnedTokens.map((token, index) => (
                      <Flex
                        alignItems="center"
                        key={index}
                        sx={{
                          gap: '4px',
                        }}
                      >
                        <Logo
                          srcs={[token.logoUrl]}
                          style={{ flex: '0 0 16px', height: '16px', borderRadius: '999px' }}
                        />
                        <Text fontSize={12}>
                          {formattedNumLong(token.amount, false)} {token.symbol}
                        </Text>
                      </Flex>
                    ))}
                  </>
                }
              />
            </Flex>

            <ButtonPrimary
              style={{
                height: '36px',
                width: 'fit-content',
                flexWrap: 'nowrap',
                padding: '0 12px',
              }}
            >
              Collect Fees
            </ButtonPrimary>
          </Flex>

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
