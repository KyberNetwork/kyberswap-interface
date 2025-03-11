import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ArrowUpRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as FreeIcon } from 'assets/svg/free_icon.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import TradePrice from 'pages/CrossChain/TradePrice'
import { useIsEnoughGas } from 'pages/CrossChain/useIsEnoughGas'
import { OutputBridgeInfo, useBridgeState, useCrossChainState } from 'state/crossChain/hooks'
import { RouteData } from 'state/crossChain/reducer'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { uint256ToFraction } from 'utils/numbers'
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
        text={<Trans>You will receive at least this amount or your transaction will revert.</Trans>}
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

export function TradeSummaryBridge({ outputInfo }: { outputInfo: OutputBridgeInfo }) {
  const theme = useTheme()
  const [{ tokenInfoOut }] = useBridgeState()

  const [show, setShow] = useState(true)
  const fee = formattedNum(outputInfo?.fee?.toString(), false, 5)
  const amount = formattedNum(tokenInfoOut?.BigValueThreshold?.toString() ?? '0')
  const symbol = tokenInfoOut?.symbol
  const minSwap = tokenInfoOut && formattedNum(tokenInfoOut.MinimumSwap)
  const maxSwap = tokenInfoOut && formattedNum(tokenInfoOut.MaximumSwap)

  return (
    <AutoColumn>
      <Header setShow={setShow} show={show} />
      <ContentWrapper show={show} gap="0.75rem">
        <Divider />
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              {t`Estimated Processing Time`}
            </TYPE.black>
            <InfoHelper
              size={14}
              text={tokenInfoOut && t`Crosschain amount larger than ${amount} ${symbol} could take up to 12 hours`}
            />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {tokenInfoOut ? outputInfo.time : '--'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Transaction Fee</Trans>
            </TYPE.black>

            <InfoHelper
              size={14}
              text={
                !tokenInfoOut ? (
                  t`Estimated network fee for your transaction`
                ) : (
                  <>
                    <Text color={theme.text}>
                      <Trans>{tokenInfoOut?.SwapFeeRatePerMillion}% Transaction Fee</Trans>
                    </Text>
                    {tokenInfoOut?.MinimumSwapFee === tokenInfoOut?.MaximumSwapFee ? (
                      Number(outputInfo.fee) > 0 && (
                        <Text marginTop={'5px'}>
                          <Trans>
                            Gas Fee: {`${fee} ${tokenInfoOut.symbol} `}
                            for your cross-chain transaction on destination chain
                          </Trans>
                        </Text>
                      )
                    ) : (
                      <Text marginTop={'5px'}>
                        <Trans>
                          Min Transaction Fee is {formattedNum(tokenInfoOut.MinimumSwapFee)} {tokenInfoOut.symbol}{' '}
                          <br />
                          Max Transaction Fee is {formattedNum(tokenInfoOut.MaximumSwapFee)} {tokenInfoOut.symbol}
                        </Trans>
                      </Text>
                    )}
                  </>
                )
              }
            />
          </RowFixed>
          <TYPE.black color={theme.text} fontSize={12}>
            {tokenInfoOut && outputInfo.fee ? `${fee} ${tokenInfoOut?.symbol}` : '--'}
          </TYPE.black>
        </RowBetween>

        <RowBetween style={{ alignItems: 'flex-start' }}>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
              <Trans>Required Amount</Trans>
            </TYPE.black>
          </RowFixed>

          <TYPE.black fontSize={12} color={theme.text} textAlign="right">
            {tokenInfoOut ? (
              <Flex flexDirection={'column'} style={{ gap: 10 }}>
                <div>
                  {t`Min`} {minSwap} {tokenInfoOut?.symbol}
                </div>
                <div>
                  {t`Max`} {maxSwap} {tokenInfoOut?.symbol}
                </div>
              </Flex>
            ) : (
              '--'
            )}
          </TYPE.black>
        </RowBetween>
      </ContentWrapper>
    </AutoColumn>
  )
}

export const formatDurationCrossChain = (duration: number) => {
  if (duration < 30) return t`half a minute`
  if (duration < 60) return t`1 minute`
  return formatTimeDuration(duration)
}

export function TradeSummaryCrossChain({
  route,
  showHeader = true,
  style,
}: {
  route: RouteData | undefined
  showHeader?: boolean
  style?: CSSProperties
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  const { chainId } = useActiveWeb3React()

  const [show, setShow] = useState(true)

  const nativeToken = NativeCurrencies[chainId]
  const { isEnoughEth, gasFee, crossChainFee, gasRefund } = useIsEnoughGas(route)

  const colorGasFee = isEnoughEth ? theme.subText : theme.warning

  const [{ currencyOut, formatRoute }] = useCrossChainState()
  const { duration, minReceive, priceImpact, totalFeeUsd, gasFeeUsd, crossChainFeeUsd, gasRefundUsd } = formatRoute

  return (
    <AutoColumn style={style}>
      {showHeader && <Header setShow={setShow} show={show} />}
      <ContentWrapper show={show} gap="0.75rem">
        {showHeader && <Divider />}

        {!showHeader && (
          <RowBetween>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip width="200px" text={<Trans>Current Price in the market.</Trans>} placement="right">
                  <Trans>Current Price</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>

            <RowFixed>{route ? <TradePrice route={route} showLogo={false} /> : '--'}</RowFixed>
          </RowBetween>
        )}

        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <MouseoverTooltip
                width="200px"
                text={<Trans>You will receive at least this amount, or your transaction will revert by Axelar.</Trans>}
                placement="right"
              >
                <Trans>Minimum Received</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {minReceive && currencyOut
                ? `${uint256ToFraction(minReceive, currencyOut.decimals).toSignificant(10)} ${currencyOut.symbol}`
                : '--'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                width="200px"
                text={<Trans>Estimate time to complete your transaction.</Trans>}
                placement="right"
              >
                {t`Estimated Processing Time`}
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {duration ? `~${formatDurationCrossChain(duration)}` : '--'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <PriceImpactNote />
          </RowFixed>
          <TYPE.black color={theme.text} fontSize={12}>
            <PriceImpactValue priceImpact={route ? priceImpact || 0 : -1} />
          </TYPE.black>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={colorGasFee}>
              <MouseoverTooltip
                width="360px"
                placement={isMobile ? undefined : 'right'}
                text={
                  totalFeeUsd && nativeToken ? (
                    <>
                      <Text fontSize={12}>
                        {!isEnoughEth ? (
                          <div>
                            <Trans>
                              You do not have enough {nativeToken.symbol} to cover the estimated gas for this
                              transaction. To buy {nativeToken.symbol} for gas, go to{' '}
                              <Text
                                as="span"
                                fontWeight={'500'}
                                color={theme.primary}
                                onClick={() => navigate(APP_PATHS.SWAP)}
                              >
                                swap
                              </Text>
                              <ArrowUpRight size={12} color={theme.primary} />.
                            </Trans>
                          </div>
                        ) : (
                          <Trans>
                            We overestimate gas by 50% to guarantee your trade. Any gas we don&apos;t use will be
                            refunded by Axelar.
                          </Trans>
                        )}
                      </Text>
                      <Text marginTop={'4px'} fontSize={12}>
                        <RowBetween>
                          <Trans>Source chain gas fee: </Trans>
                          <Text as="span" color={colorGasFee}>
                            ~{gasFee?.toSignificant(10)} {nativeToken?.symbol} ({formattedNum(gasFeeUsd + '', true)})
                          </Text>
                        </RowBetween>
                        <RowBetween>
                          <Trans>Cross-chain fee: </Trans>
                          <Text as="span" color={colorGasFee}>
                            {crossChainFee?.toSignificant(10)} {nativeToken?.symbol} (
                            {formattedNum(crossChainFeeUsd + '', true)})
                          </Text>
                        </RowBetween>
                        <RowBetween>
                          <Trans>Expected gas refund: </Trans>
                          <Text as="span" color={colorGasFee}>
                            {gasRefund?.toSignificant(10)} {nativeToken?.symbol} (
                            {formattedNum(gasRefundUsd + '', true)})
                          </Text>
                        </RowBetween>
                      </Text>
                    </>
                  ) : null
                }
              >
                <Trans>Gas Fee</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <TYPE.black color={isEnoughEth ? theme.text : theme.warning} fontSize={12}>
            {Number(totalFeeUsd) ? formattedNum(totalFeeUsd + '', true) : '--'}
          </TYPE.black>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                width="200px"
                text={<Trans>Fees charged by KyberSwap and Squid.</Trans>}
                placement="right"
              >
                <Trans>Service Fee</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.primary} fontSize={12} fontWeight={'500'}>
            <FreeIcon />
            <Trans>Free</Trans>
          </Flex>
        </RowBetween>
      </ContentWrapper>
    </AutoColumn>
  )
}
