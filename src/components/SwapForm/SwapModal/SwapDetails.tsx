import { Currency, Price, Rounding } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'

import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum, toK } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'
import { checkPriceImpact } from 'utils/prices'

function formattedMinimumReceived(number: string) {
  if (number === '' || number === undefined) {
    return 0
  }

  const num = parseFloat(number)

  if (num > 500000000) {
    return toK(num.toFixed(0))
  }

  if (num === 0) {
    return 0
  }

  if (num < 0.0001 && num > 0) {
    return '< 0.0001'
  }

  if (num >= 1000) {
    return Number(num.toFixed(0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  return Number(num.toFixed(6)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

function formatExecutionPrice(executionPrice?: Price<Currency, Currency>, inverted?: boolean): string {
  if (!executionPrice) {
    return ''
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  return inverted
    ? `${executionPrice.invert().toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${inputSymbol} / ${outputSymbol}`
    : `${executionPrice.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${outputSymbol} / ${inputSymbol}`
}

export type Props = {
  acceptedChanges:
    | Pick<DetailedRouteSummary, 'gasUsd' | 'parsedAmountOut' | 'priceImpact' | 'executionPrice' | 'amountInUsd'>
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
        {formattedMinimumReceived(minimumAmountOut.toSignificant(6))} {currencyOut.symbol}
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

      <PriceImpactNote
        priceImpact={routeSummary?.priceImpact}
        hasTooltip={false}
        style={{
          marginTop: '16px',
        }}
      />
    </>
  )
}

export default SwapDetails
