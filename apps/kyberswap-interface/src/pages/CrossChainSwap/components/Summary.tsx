import styled from 'styled-components'
import { Quote } from '../registry'
import { Flex, Text } from 'rebass'
import { MouseoverTooltip } from 'components/Tooltip'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { formatUnits } from 'viem'
import { formatDisplayNumber } from 'utils/numbers'
import useTheme from 'hooks/useTheme'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { ExternalLink } from 'theme'
import { Currency } from '../adapters'

const Wrapper = styled.div`
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 1rem;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const Summary = ({ quote, tokenOut, full }: { quote?: Quote; tokenOut?: Currency; full?: boolean }) => {
  const [slippage] = useUserSlippageTolerance()

  const { currencyIn } = useCrossChainSwap()

  const theme = useTheme()
  const minimumReceived =
    quote && tokenOut
      ? formatUnits((quote.quote.outputAmount * (10000n - BigInt(slippage))) / 10000n, tokenOut.decimals)
      : '--'

  return (
    <Wrapper>
      {full && (
        <Flex justifyContent="space-between">
          <Text color={theme.subText}>Current price</Text>
          <Text>
            1 {currencyIn?.symbol} = {formatDisplayNumber(quote?.quote.rate, { significantDigits: 8 })}{' '}
            {tokenOut?.symbol}
          </Text>
        </Flex>
      )}

      <Flex justifyContent="space-between">
        <MouseoverTooltip text="You will receive at least this amount or your transaction will revert.">
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Minimum Received
          </Text>
        </MouseoverTooltip>
        <Text>
          {formatDisplayNumber(minimumReceived, { significantDigits: 8 })} {tokenOut?.symbol}
        </Text>
      </Flex>
      <Flex justifyContent="space-between">
        <MouseoverTooltip text="Estimated processing time for your transaction.">
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Estimated Processing Time
          </Text>
        </MouseoverTooltip>
        <Text>{quote ? `~${quote.quote.timeEstimate}s` : '--'}</Text>
      </Flex>

      <Flex justifyContent="space-between">
        <MouseoverTooltip text="Estimated change in price due to the size of your transaction.">
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Price Impact
          </Text>
        </MouseoverTooltip>
        <Text>{quote ? `${Math.abs(quote.quote.priceImpact).toFixed(2)}%` : '--'}</Text>
      </Flex>

      {quote && quote.quote.protocolFee > 0 && (
        <Flex justifyContent="space-between">
          <MouseoverTooltip text="UI Fee">
            <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
              Protocol Fee
            </Text>
          </MouseoverTooltip>
          <Text>{formatDisplayNumber(quote.quote.protocolFee, { style: 'currency', fractionDigits: 2 })}</Text>
        </Flex>
      )}

      <Flex justifyContent="space-between">
        <MouseoverTooltip text="UI Fee">
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Platform Fee
          </Text>
        </MouseoverTooltip>
        <Text>{quote ? `${quote.quote.platformFeePercent.toFixed(2)}%` : '--'}</Text>
      </Flex>

      {/*
      <Flex justifyContent="space-between">
        <MouseoverTooltip text="Estimated network fee for your transaction.">
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Est. Gas Fee
          </Text>
        </MouseoverTooltip>
        <Text>
          {quote ? `${formatDisplayNumber(quote.quote.gasFeeUsd, { style: 'currency', significantDigits: 4 })}` : '--'}
        </Text>
      </Flex>
          */}

      <Flex justifyContent="space-between">
        <MouseoverTooltip
          placement="right"
          text={
            <Text>
              During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
              <ExternalLink
                href={'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'}
              >
                here ↗
              </ExternalLink>
            </Text>
          }
        >
          <Text color={theme.subText} sx={{ borderBottom: `1px dotted ${theme.border}` }}>
            Max Slippage
          </Text>
        </MouseoverTooltip>

        <Text>{((slippage * 100) / 10_000).toFixed(2)}%</Text>
      </Flex>
    </Wrapper>
  )
}
