import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { computeSlippageAdjustedAmounts } from 'utils/prices'
import { formatTimeDuration } from 'utils/time'

const IconWrapper = styled.div<{ show: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ show }) => (!show ? '0deg' : '-180deg')});
  transition: transform 300ms;
`
const ContentWrapper = styled(AutoColumn)<{ show: boolean }>`
  max-height: ${({ show }) => (show ? '500px' : 0)};
  margin-top: ${({ show }) => (show ? '12px' : 0)};
  transition: margin-top 300ms ease, height 300ms ease;
  overflow: hidden;
`

const PriceImpactNote = () => {
  const theme = useTheme()
  return (
    <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
      <MouseoverTooltip
        text={
          <div>
            <Trans>Estimated change in price due to the size of your transaction.</Trans>
            <Text fontSize={12}>
              <Trans>
                Read more{' '}
                <a
                  href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                  target="_blank"
                  rel="noreferrer"
                >
                  <b>here ↗</b>.
                </a>
              </Trans>
            </Text>
          </div>
        }
        placement="right"
      >
        <Trans>Price Impact</Trans>
      </MouseoverTooltip>
    </TextDashed>
  )
}

const PriceImpactValue = ({ priceImpact }: { priceImpact: number }) => {
  const theme = useTheme()
  return (
    <TYPE.black fontSize={12} color={priceImpact > 15 ? theme.red : priceImpact > 5 ? theme.warning : theme.text}>
      {priceImpact === -1 ? '--' : priceImpact > 0.01 ? priceImpact.toFixed(3) + '%' : '< 0.01%'}
    </TYPE.black>
  )
}

const Header = ({ show, setShow }: { show: boolean; setShow: (fuc: (v: boolean) => boolean) => void }) => {
  const theme = useTheme()
  return (
    <RowBetween style={{ cursor: 'pointer' }} onClick={() => setShow(prev => !prev)} role="button">
      <Text fontSize={12} fontWeight={500} color={theme.text}>
        <Trans>MORE INFORMATION</Trans>
      </Text>
      <IconWrapper show={show}>
        <DropdownSVG></DropdownSVG>
      </IconWrapper>
    </RowBetween>
  )
}

const MinReceiveLabel = () => {
  const theme = useTheme()
  return (
    <TextDashed fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
      <MouseoverTooltip
        width="200px"
        text={
          <>
            <Text>
              <Trans>You will receive at least this amount, or your transaction will revert.</Trans>
            </Text>
            <Text>
              <Trans>
                Any{' '}
                <a
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/aggregator-api-specification/evm-swaps#kyberswap-positive-slippage-surplus-collection"
                  target="_blank"
                  rel="noreferrer"
                >
                  positive slippage
                </a>{' '}
                will accrue to KyberSwap.
              </Trans>
            </Text>
          </>
        }
        placement="right"
      >
        <Trans>Minimum Received</Trans>
      </MouseoverTooltip>
    </TextDashed>
  )
}

interface TradeSummaryProps {
  trade: Aggregator
  allowedSlippage: number
}

function TradeSummary({ trade, allowedSlippage }: TradeSummaryProps) {
  const theme = useTheme()
  const [show, setShow] = useState(true)

  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)
  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  return (
    <AutoColumn>
      <Header setShow={setShow} show={show} />
      <ContentWrapper show={show} gap="0.75rem">
        <Divider />
        <RowBetween>
          <RowFixed style={{ minWidth: 'max-content' }}>
            <MinReceiveLabel />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {isExactIn
                ? !!slippageAdjustedAmounts[Field.OUTPUT]
                  ? `${formattedNum(slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(10) || '0')} ${
                      nativeOutput?.symbol
                    }`
                  : '-'
                : !!slippageAdjustedAmounts[Field.INPUT]
                ? `${formattedNum(slippageAdjustedAmounts[Field.INPUT]?.toSignificant(10) || '0')} ${
                    nativeInput?.symbol
                  }`
                : '-'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Gas Fee</Trans>
            </TYPE.black>

            <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
          </RowFixed>
          <TYPE.black color={theme.text} fontSize={12}>
            {trade.gasUsd ? formattedNum(trade.gasUsd?.toString(), true) : '--'}
          </TYPE.black>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <PriceImpactNote />
          </RowFixed>
          <PriceImpactValue priceImpact={trade.priceImpact} />
        </RowBetween>
      </ContentWrapper>
    </AutoColumn>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Aggregator
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  return trade ? <TradeSummary trade={trade} allowedSlippage={allowedSlippage} /> : null
}

export const formatDurationCrossChain = (duration: number) => {
  if (duration < 30) return t`half a minute`
  if (duration < 60) return t`1 minute`
  return formatTimeDuration(duration)
}
