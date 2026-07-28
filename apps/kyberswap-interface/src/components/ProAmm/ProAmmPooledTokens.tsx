import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'

import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { formatDisplayNumber } from 'utils/numbers'

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
  const render =
    layout === 0 ? (
      <OutlineCard className="mt-4 p-4">
        <AutoColumn className="gap-3">
          <span className="text-xs font-medium">{title || <Trans>Your Liquidity</Trans>}</span>

          <Divider />
          {liquidityValue0?.greaterThan(ZERO) && (
            <RowBetween>
              <span className="text-xs font-medium text-subText">
                {pooled && 'POOLED'} {liquidityValue0?.currency.symbol}
              </span>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0.currency} />
                <span className="ml-1.5 text-xs font-medium">
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency.symbol}
                </span>
              </RowFixed>
            </RowBetween>
          )}
          {liquidityValue1?.greaterThan(ZERO) && (
            <RowBetween>
              <span className="text-xs font-medium text-subText">
                {pooled && 'POOLED'} {liquidityValue1?.currency.symbol}
              </span>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1.currency} />
                <span className="ml-1.5 text-xs font-medium">
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency.symbol}
                </span>
              </RowFixed>
            </RowBetween>
          )}
        </AutoColumn>
      </OutlineCard>
    ) : (
      <OutlineCard className="mt-4 p-4">
        <AutoColumn className="gap-3">
          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Liquidity Balance</Trans>
            </span>
            <span className="text-xs font-medium">
              {formatDisplayNumber(valueUSD || 0, { style: 'currency', significantDigits: 4 })}
            </span>
          </RowBetween>
          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Pooled {liquidityValue0?.currency?.symbol}</Trans>
            </span>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
              <span className="ml-1.5 text-xs font-medium">
                {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                {liquidityValue0?.currency.symbol}
              </span>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Pooled {liquidityValue1?.currency?.symbol}</Trans>
            </span>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
              <span className="ml-1.5 text-xs font-medium">
                {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                {liquidityValue1?.currency.symbol}
              </span>
            </RowFixed>
          </RowBetween>

          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Staked Balance</Trans>
            </span>
            <span className="text-xs font-medium">
              {formatDisplayNumber(stakedUsd || 0, { style: 'currency', significantDigits: 4 })}
            </span>
          </RowBetween>

          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Pool APR</Trans>
              {createdAt && (
                <InfoHelper
                  placement="top"
                  text={<Trans>Position was created at {dayjs(createdAt * 1000).format('YYYY-MM-DD HH:mm')}</Trans>}
                />
              )}
            </span>
            <span className="text-xs font-medium text-apr">{positionAPR === '--' ? '--' : positionAPR + '%'}</span>
          </RowBetween>

          <RowBetween>
            <span className="text-xs font-medium text-subText">
              <Trans>My Farm APR</Trans>
            </span>
            {!!farmAPR && !!farmRewardAmount?.length ? (
              <MouseoverTooltip
                width="fit-content"
                text={
                  <div className="flex flex-col gap-2">
                    {farmRewardAmount.map((item, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <CurrencyLogo currency={item.currency} size="14px" />
                        <span>
                          {item.toSignificant(6)} {item.currency.symbol}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              >
                <span className="border-b border-dotted border-border text-xs font-medium text-apr">
                  {farmAPR ? `${farmAPR.toFixed(2)}%` : '--'}
                </span>
              </MouseoverTooltip>
            ) : (
              <span className="text-xs font-medium text-apr">{farmAPR ? `${farmAPR.toFixed(2)}%` : '--'}</span>
            )}
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    )
  return render
}
