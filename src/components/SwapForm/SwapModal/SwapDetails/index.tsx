import { Currency, Price, Rounding } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import SlippageValue from 'components/SwapForm/SwapModal/SwapDetails/SlippageValue'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { InfoHelperForMaxSlippage } from 'components/swapv2/SwapSettingsPanel/SlippageSetting'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { TruncatedText } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TYPE } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum } from 'utils'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { getFormattedFeeAmountUsdV2 } from 'utils/fee'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'

interface ExecutionPriceProps {
  executionPrice?: Price<Currency, Currency>
  showInverted?: boolean
}

function ExecutionPrice({ executionPrice, showInverted }: ExecutionPriceProps) {
  if (!executionPrice) {
    return null
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  return (
    <>
      <TruncatedText>
        {showInverted
          ? `${executionPrice
              .invert()
              .toSignificant(RESERVE_USD_DECIMALS, undefined, Rounding.ROUND_DOWN)} ${inputSymbol} / ${outputSymbol}`
          : `${executionPrice.toSignificant(RESERVE_USD_DECIMALS, undefined, Rounding.ROUND_DOWN)}`}
      </TruncatedText>
      <Text style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}>
        &nbsp;{outputSymbol} / {inputSymbol}
      </Text>
    </>
  )
}

type Optional<T> = {
  [key in keyof T]: T[key] | undefined
}

export type Props = {
  isLoading: boolean
  hasError: boolean
} & Optional<
  Pick<DetailedRouteSummary, 'gasUsd' | 'parsedAmountOut' | 'executionPrice' | 'amountInUsd' | 'priceImpact'>
>

export default function SwapDetails({
  isLoading,
  hasError,
  gasUsd,
  parsedAmountOut,
  executionPrice,
  amountInUsd,
  priceImpact,
}: Props) {
  const { isEVM } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const { feeConfig, slippage } = useSwapFormContext()

  const formattedFeeAmountUsd = getFormattedFeeAmountUsdV2(Number(amountInUsd || 0), feeConfig?.feeAmount)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Flex style={{ color: theme.text, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        <TruncatedText style={{ width: '-webkit-fill-available' }}>
          {minimumAmountOut.toSignificant(RESERVE_USD_DECIMALS)}
        </TruncatedText>
        <Text style={{ minWidth: 'auto' }}>&nbsp;{currencyOut.symbol}</Text>
      </Flex>
    ) : (
      ''
    )

  const priceImpactResult = checkPriceImpact(priceImpact)

  return (
    <>
      <AutoColumn
        gap="0.5rem"
        style={{ padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '16px' }}
      >
        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <Text fontWeight={400} fontSize={12} color={theme.subText} minWidth="max-content">
            <Trans>Current Price</Trans>
          </Text>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '160px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={
              executionPrice ? (
                <Flex
                  fontWeight={500}
                  fontSize={12}
                  color={theme.text}
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'right',
                  }}
                >
                  <ExecutionPrice executionPrice={executionPrice} showInverted={showInverted} />
                  <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                    <Repeat size={14} color={theme.text} />
                  </StyledBalanceMaxMini>
                </Flex>
              ) : (
                <TYPE.black fontSize={14}>--</TYPE.black>
              )
            }
          />
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <Trans>Minimum Received</Trans>
            </TYPE.black>
            <InfoHelper
              placement="top"
              size={14}
              text={t`You will receive at least this amount or your transaction will revert`}
            />
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '108px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={<TYPE.black fontSize={12}>{minimumAmountOutStr || '--'}</TYPE.black>}
          />
        </RowBetween>

        {isEVM && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText} minWidth="min-content">
                <Trans>Gas Fee</Trans>
              </TYPE.black>
              <InfoHelper placement="top" size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>

            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '64px',
                height: '19px',
              }}
              isShowingSkeleton={isLoading}
              content={
                <TYPE.black color={theme.text} fontSize={12}>
                  {gasUsd ? formattedNum(String(gasUsd), true) : '--'}
                </TYPE.black>
              }
            />
          </RowBetween>
        )}

        <RowBetween height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.black>
            <InfoHelper
              placement="top"
              size={14}
              text={t`Estimated change in price due to the size of your transaction`}
            />
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '64px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={
              <TYPE.black
                fontSize={12}
                color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
              >
                {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
              </TYPE.black>
            }
          />
        </RowBetween>

        <RowBetween height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Max Slippage</Trans>
            </TYPE.black>
            <InfoHelperForMaxSlippage />
          </RowFixed>

          <SlippageValue />
        </RowBetween>

        {feeConfig && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Referral Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {formattedFeeAmountUsd}
            </TYPE.black>
          </RowBetween>
        )}
      </AutoColumn>
    </>
  )
}
