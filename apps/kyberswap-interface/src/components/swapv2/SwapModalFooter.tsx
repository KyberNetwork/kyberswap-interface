import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { TruncatedText } from 'components'
import { ButtonError } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { ExternalLink, TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { checkPriceImpact, computeSlippageAdjustedAmounts, formatExecutionPrice, formatPriceImpact } from 'utils/prices'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Aggregator
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [allowedSlippage, trade],
  )
  const [isDegenMode] = useDegenModeManager()
  const cate = usePairCategory()
  const isWarningSlippage = checkWarningSlippage(allowedSlippage, cate)

  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  const { priceImpact } = trade
  const priceImpactResult = checkPriceImpact(priceImpact)

  return (
    <>
      <AutoColumn gap="8px" style={{ padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '16px' }}>
        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <Text fontWeight={400} fontSize={12} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <Text
            fontWeight={500}
            fontSize={12}
            color={theme.text}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px',
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} color={theme.text} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
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
          </RowFixed>
          <TYPE.black fontSize={12} fontWeight={500}>
            <Flex style={{ color: theme.text, fontWeight: 500, whiteSpace: 'nowrap' }}>
              <TruncatedText style={{ width: '-webkit-fill-available' }}>
                {formattedNum(slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(10) || '', false, 10)}
              </TruncatedText>
              <Text style={{ minWidth: 'auto' }}>&nbsp;{nativeOutput?.symbol}</Text>
            </Flex>
          </TYPE.black>
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed>
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
                          <b>here ↗</b>
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
          </RowFixed>
          <TYPE.black
            fontSize={12}
            color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </TYPE.black>
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                text={
                  <Text>
                    <Trans>
                      During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                      <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                        here ↗
                      </ExternalLink>
                    </Trans>
                  </Text>
                }
                placement="right"
              >
                <Trans>Max Slippage</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <TYPE.black fontSize={12} color={isWarningSlippage ? theme.warning : undefined}>
            {formatSlippage(allowedSlippage)}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
        <SlippageWarningNote rawSlippage={allowedSlippage} />

        <PriceImpactNote priceImpact={priceImpact} isDegenMode={isDegenMode} />

        <AutoRow>
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{
              ...((priceImpactResult.isVeryHigh || priceImpactResult.isInvalid) && {
                border: 'none',
                background: theme.red,
                color: theme.text,
              }),
            }}
            id="confirm-swap-or-send"
          >
            <Text fontSize={14} fontWeight={500}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonError>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      </Flex>
    </>
  )
}
