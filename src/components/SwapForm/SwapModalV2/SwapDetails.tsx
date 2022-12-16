import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { AlertTriangle, Repeat } from 'react-feather'
import { useSelector } from 'react-redux'
import { Text } from 'rebass'

import { ButtonError } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import HurryUpBanner from 'components/swapv2/HurryUpBanner'
import { Dots, StyledBalanceMaxMini, SwapCallbackError } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { useEncodeSolana, useOutputCurrency } from 'state/swap/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'

import { getFormattedFeeAmountUsd, isHighPriceImpact, isVeryHighPriceImpact } from '../utils'

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

type Props = {
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  startedTime: number | undefined
}
const SwapDetails: React.FC<Props> = ({ onConfirm, swapErrorMessage, disabledConfirm, startedTime }) => {
  const { isSolana, isEVM } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const [encodeSolana] = useEncodeSolana()

  const currencyOut = useOutputCurrency()
  const [allowedSlippage] = useUserSlippageTolerance()
  const priceImpact = useSelector((state: AppState) => state.swap.routeSummary?.priceImpact)
  const amountInUsd = useSelector((state: AppState) => state.swap.routeSummary?.amountInUsd)
  const amountOut = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountOut)
  const gasUsd = useSelector((state: AppState) => state.swap.routeSummary?.gasUsd)
  const executionPrice = useSelector((state: AppState) => state.swap.routeSummary?.executionPrice)
  const feeConfig = useSelector((state: AppState) => state.swap.feeConfig)
  const isPriceImpactHigh = isHighPriceImpact(priceImpact)
  const isPriceImpactVeryHigh = isVeryHighPriceImpact(priceImpact)

  const formattedFeeAmountUsd = getFormattedFeeAmountUsd(Number(amountInUsd || 0), feeConfig?.feeAmount)

  const minimumAmountOut = amountOut ? minimumAmountAfterSlippage(amountOut, allowedSlippage) : undefined
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut
      ? `${formattedNum(minimumAmountOut.toSignificant(10) || '0')} ${currencyOut.symbol}`
      : ''
  return (
    <>
      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
        <TYPE.italic textAlign="left" style={{ width: '100%' }}>
          {minimumAmountOutStr && (
            <Trans>
              Output is estimated. You will receive at least <b>{minimumAmountOutStr}</b> or the transaction will
              revert.
            </Trans>
          )}
          {isSolana && <Trans>We may send multiple transactions to complete the swap.</Trans>}
        </TYPE.italic>
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
            color={isPriceImpactVeryHigh ? theme.red : isPriceImpactHigh ? theme.warning : theme.text}
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
          <TYPE.black fontSize={14}>{allowedSlippage / 100}%</TYPE.black>
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

      {isPriceImpactHigh && (
        <AutoRow
          style={{
            marginTop: '16px',
            padding: '15px 20px',
            borderRadius: '16px',
            backgroundColor: rgba(isPriceImpactVeryHigh ? theme.red : theme.warning, 0.35),
            color: theme.text,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '18px',
          }}
        >
          <AlertTriangle
            color={isPriceImpactVeryHigh ? theme.red : theme.warning}
            size={16}
            style={{ marginRight: '10px' }}
          />
          {isPriceImpactVeryHigh ? <Trans>Price impact is VERY high!</Trans> : <Trans>Price impact is high!</Trans>}
        </AutoRow>
      )}
      <HurryUpBanner startedTime={startedTime} />
      <AutoRow>
        {isSolana && !encodeSolana ? (
          <GreyCard
            style={{ textAlign: 'center', borderRadius: '999px', padding: '12px', marginTop: '24px' }}
            id="confirm-swap-or-send"
          >
            <Dots>
              <Trans>Checking accounts</Trans>
            </Dots>
          </GreyCard>
        ) : (
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{
              marginTop: '24px',
              ...(isPriceImpactHigh && {
                border: 'none',
                background: isPriceImpactVeryHigh ? theme.red : theme.warning,
                color: theme.text,
              }),
            }}
            id="confirm-swap-or-send"
          >
            <Text fontSize={16} fontWeight={500}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonError>
        )}

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}

export default SwapDetails
