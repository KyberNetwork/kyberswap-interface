import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { AlertTriangle, Repeat } from 'react-feather'
import { Text } from 'rebass'

import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { RouteSummary } from 'types/metaAggregator'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'
import { checkPriceImpact } from 'utils/prices'

function formatExecutionPrice(executionPrice?: Price<Currency, Currency>, inverted?: boolean): string {
  if (!executionPrice) {
    return ''
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  return inverted
    ? `${executionPrice.invert().toSignificant(6)} ${inputSymbol} / ${outputSymbol}`
    : `${executionPrice.toSignificant(6)} ${outputSymbol} / ${inputSymbol}`
}

export type Props = {
  acceptedChanges:
    | Pick<RouteSummary, 'gasUsd' | 'parsedAmountOut' | 'priceImpact' | 'executionPrice' | 'amountInUsd'>
    | undefined
}
const SwapDetails: React.FC<Props> = ({ acceptedChanges }) => {
  const { isSolana, isEVM } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const { routeSummary, feeConfig, slippage } = useSwapFormContext()

  const { gasUsd, parsedAmountOut, priceImpact, executionPrice, amountInUsd } = acceptedChanges || routeSummary || {}

  const priceImpactResult = checkPriceImpact(priceImpact)

  const formattedFeeAmountUsd = getFormattedFeeAmountUsdV2(Number(amountInUsd || 0), feeConfig?.feeAmount)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Text
        as="span"
        sx={{
          color: theme.text,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
        }}
      >
        {formattedNum(minimumAmountOut.toSignificant(6) || '0')} {currencyOut.symbol}
      </Text>
    ) : (
      ''
    )
  return (
    <>
      <AutoColumn justify="flex-start" gap="sm">
        <TYPE.subHeader textAlign="left" style={{ width: '100%', marginBottom: '16px', color: theme.subText }}>
          {minimumAmountOutStr && (
            <Trans>
              Output is estimated. You will receive at least {minimumAmountOutStr} or the transaction will revert.
            </Trans>
          )}
          {isSolana && <Trans>We may send multiple transactions to complete the swap.</Trans>}
        </TYPE.subHeader>
      </AutoColumn>

      <AutoColumn gap="0.5rem" style={{ padding: '1rem', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
        <RowBetween align="center">
          <Text fontWeight={400} fontSize={14} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px',
            }}
          >
            {formatExecutionPrice(executionPrice, showInverted)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} color={theme.text} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Minimum Received</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`You will receive at least this amount or your transaction will revert`} />
          </RowFixed>
          <RowFixed>
            <TYPE.black fontSize={14}>{minimumAmountOutStr}</TYPE.black>
          </RowFixed>
        </RowBetween>
        {isEVM && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>

            <TYPE.black color={theme.text} fontSize={14}>
              {gasUsd ? formattedNum(String(gasUsd), true) : '--'}
            </TYPE.black>
          </RowBetween>
        )}

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
          </RowFixed>
          <TYPE.black
            fontSize={14}
            color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
          >
            {priceImpact && priceImpact > 0.01 ? parseFloat(priceImpact.toFixed(3)) : '< 0.01'}%
          </TYPE.black>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Slippage</Trans>
            </TYPE.black>
          </RowFixed>
          <TYPE.black fontSize={14}>{slippage / 100}%</TYPE.black>
        </RowBetween>

        {feeConfig && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
                <Trans>Referral Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={14}>
              {formattedFeeAmountUsd}
            </TYPE.black>
          </RowBetween>
        )}
      </AutoColumn>

      {priceImpactResult.isHigh && (
        <AutoRow
          style={{
            marginTop: '16px',
            padding: '15px 20px',
            borderRadius: '16px',
            backgroundColor: rgba(priceImpactResult.isVeryHigh ? theme.red : theme.warning, 0.35),
            color: theme.text,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '18px',
          }}
        >
          <AlertTriangle
            color={priceImpactResult.isVeryHigh ? theme.red : theme.warning}
            size={16}
            style={{ marginRight: '10px' }}
          />
          {priceImpactResult.isVeryHigh ? (
            <Trans>Price impact is VERY high!</Trans>
          ) : (
            <Trans>Price impact is high!</Trans>
          )}
        </AutoRow>
      )}
    </>
  )
}

export default SwapDetails
