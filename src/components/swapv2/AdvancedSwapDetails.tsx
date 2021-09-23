import { Currency, TradeType } from 'libs/sdk/src'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { t } from '@lingui/macro'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { Aggregator } from '../../utils/aggregator'
import { ButtonGray } from '../Button'
import { GroupButtonReturnTypes } from './styleds'
import { useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'

function TradeSummary({ trade, allowedSlippage }: { trade: Aggregator; allowedSlippage: number }) {
  const theme = useContext(ThemeContext)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)
  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)
  return (
    <>
      <AutoColumn style={{ padding: '0 20px' }}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              {isExactIn ? t`Minimum received` : t`Maximum sold`}
            </TYPE.black>
            <QuestionHelper
              text={t`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
            />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1} fontSize={14}>
              {isExactIn
                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${nativeOutput?.symbol}` ?? '-'
                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${nativeInput?.symbol}` ?? '-'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Aggregator
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()
  const { saveGas } = useSwapState()
  const { onChooseToSaveGas } = useSwapActionHandlers()

  return (
    <>
      <AutoColumn style={{ padding: '0 20px' }}>
        <GroupButtonReturnTypes>
          <ButtonGray
            className={`button-return-type ${saveGas ? '' : 'button-active'}`}
            onClick={() => onChooseToSaveGas(false)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8.00001 1.33325C4.32001 1.33325 1.33334 4.31992 1.33334 7.99992C1.33334 11.6799 4.32001 14.6666 8.00001 14.6666C11.68 14.6666 14.6667 11.6799 14.6667 7.99992C14.6667 4.31992 11.68 1.33325 8.00001 1.33325ZM8.58668 11.8399V12.0799C8.58668 12.3999 8.32668 12.6666 8.00001 12.6666C7.68001 12.6666 7.41334 12.4066 7.41334 12.0799V11.7999C6.99334 11.6999 6.12668 11.3933 5.62001 10.3999C5.46668 10.1066 5.61334 9.73992 5.92001 9.61325L5.96668 9.59325C6.24001 9.47992 6.54668 9.59325 6.68668 9.85325C6.90001 10.2599 7.32001 10.7666 8.10001 10.7666C8.72001 10.7666 9.42001 10.4466 9.42001 9.69325C9.42001 9.05325 8.95334 8.71992 7.90001 8.33992C7.16668 8.07992 5.66668 7.65325 5.66668 6.13325C5.66668 6.06659 5.67334 4.53325 7.41334 4.15992V3.91992C7.41334 3.59325 7.68001 3.33325 8.00001 3.33325C8.32001 3.33325 8.58668 3.59325 8.58668 3.91992V4.16659C9.30001 4.29325 9.75334 4.67325 10.0267 5.03325C10.2533 5.32659 10.1333 5.75325 9.78668 5.89992C9.54668 5.99992 9.26668 5.91992 9.10668 5.71325C8.92001 5.45992 8.58668 5.19992 8.04001 5.19992C7.57334 5.19992 6.83334 5.44659 6.83334 6.12659C6.83334 6.75992 7.40668 6.99992 8.59334 7.39325C10.1933 7.94659 10.6 8.75992 10.6 9.69325C10.6 11.4466 8.93334 11.7799 8.58668 11.8399Z"
                fill="currentColor"
              />
            </svg>
            {t`Maximum Return`}
          </ButtonGray>
          <ButtonGray
            className={`button-return-type ${saveGas ? 'button-active' : ''}`}
            onClick={() => onChooseToSaveGas(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.18 4.82L13.1867 4.81333L11.06 2.68667C10.8667 2.49333 10.5467 2.49333 10.3533 2.68667C10.16 2.88 10.16 3.2 10.3533 3.39333L11.4067 4.44667C10.7067 4.71333 10.2333 5.42667 10.3533 6.25333C10.46 6.98667 11.0867 7.58 11.82 7.66C12.1333 7.69333 12.4067 7.64 12.6667 7.52667V12.3333C12.6667 12.7 12.3667 13 12 13C11.6333 13 11.3333 12.7 11.3333 12.3333V9.33333C11.3333 8.6 10.7333 8 10 8H9.33334V3.33333C9.33334 2.6 8.73334 2 8.00001 2H4.00001C3.26667 2 2.66667 2.6 2.66667 3.33333V13.3333C2.66667 13.7 2.96667 14 3.33334 14H8.66667C9.03334 14 9.33334 13.7 9.33334 13.3333V9H10.3333V12.24C10.3333 13.1133 10.96 13.9067 11.8267 13.9933C12.8267 14.0933 13.6667 13.3133 13.6667 12.3333V6C13.6667 5.54 13.48 5.12 13.18 4.82ZM8.00001 6.66667H4.00001V4C4.00001 3.63333 4.30001 3.33333 4.66667 3.33333H7.33334C7.70001 3.33333 8.00001 3.63333 8.00001 4V6.66667ZM12 6.66667C11.6333 6.66667 11.3333 6.36667 11.3333 6C11.3333 5.63333 11.6333 5.33333 12 5.33333C12.3667 5.33333 12.6667 5.63333 12.6667 6C12.6667 6.36667 12.3667 6.66667 12 6.66667Z"
                fill="currentColor"
              />
            </svg>
            {t`Lowest Gas Cost`}
          </ButtonGray>
        </GroupButtonReturnTypes>
      </AutoColumn>

      <AutoColumn gap="md">
        {trade && (
          <>
            <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          </>
        )}
      </AutoColumn>
    </>
  )
}
