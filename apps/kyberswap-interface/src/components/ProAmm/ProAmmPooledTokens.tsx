import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { formatDollarAmount } from 'utils/numbers'

export default function ProAmmPooledTokens({
  liquidityValue0,
  liquidityValue1,
  layout = 0,
  valueUSD,
  stakedUsd,
  title,
  pooled = false,
  positionAPR,
  createdAt,
  farmAPR,
  farmRewardAmount,
}: {
  liquidityValue0: CurrencyAmount<Currency> | undefined
  liquidityValue1: CurrencyAmount<Currency> | undefined
  layout?: number
  valueUSD?: number
  stakedUsd?: number
  title?: string
  pooled?: boolean
  positionAPR?: string
  createdAt?: number
  farmAPR?: number
  farmRewardAmount?: Array<CurrencyAmount<Currency>>
}) {
  const theme = useTheme()
  const render =
    layout === 0 ? (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="12px" fontWeight="500">
            {title || <Trans>Your Liquidity</Trans>}
          </Text>

          <Divider />
          {liquidityValue0?.greaterThan(ZERO) && (
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                {pooled && 'POOLED'} {liquidityValue0?.currency.symbol}
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          )}
          {liquidityValue1?.greaterThan(ZERO) && (
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                {pooled && 'POOLED'} {liquidityValue1?.currency.symbol}
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          )}
        </AutoColumn>
      </OutlineCard>
    ) : (
      <>
        <OutlineCard marginTop="1rem" padding="1rem">
          <AutoColumn gap="md">
            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>My Liquidity Balance</Trans>
              </Text>
              <Text fontSize={12} fontWeight="500">
                {formatDollarAmount(valueUSD || 0)}
              </Text>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>My Pooled {liquidityValue0?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>My Pooled {liquidityValue1?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>

            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>My Staked Balance</Trans>
              </Text>
              <Text fontSize={12} fontWeight="500">
                {formatDollarAmount(stakedUsd || 0)}
              </Text>
            </RowBetween>

            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>My Pool APR</Trans>
                {createdAt && (
                  <InfoHelper
                    placement="top"
                    text={<Trans>Position was created at {dayjs(createdAt * 1000).format('YYYY-MM-DD HH:mm')}</Trans>}
                  />
                )}
              </Text>
              <Text fontSize={12} fontWeight="500" color={theme.apr}>
                {positionAPR === '--' ? '--' : positionAPR + '%'}
              </Text>
            </RowBetween>

            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>My Farm APR</Trans>
              </Text>
              {!!farmAPR && !!farmRewardAmount?.length ? (
                <MouseoverTooltip
                  width="fit-content"
                  text={
                    <Flex flexDirection="column" sx={{ gap: '8px' }}>
                      {farmRewardAmount.map((item, index) => (
                        <Flex key={index} alignItems="center" sx={{ gap: '4px' }}>
                          <CurrencyLogo currency={item.currency} size="14px" />
                          <Text>
                            {item.toSignificant(6)} {item.currency.symbol}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  }
                >
                  <Text
                    fontSize={12}
                    fontWeight="500"
                    color={theme.apr}
                    sx={{ borderBottom: `1px dotted ${theme.border}` }}
                  >
                    {farmAPR ? `${farmAPR.toFixed(2)}%` : '--'}
                  </Text>
                </MouseoverTooltip>
              ) : (
                <Text fontSize={12} fontWeight="500" color={theme.apr}>
                  {farmAPR ? `${farmAPR.toFixed(2)}%` : '--'}
                </Text>
              )}
            </RowBetween>
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
