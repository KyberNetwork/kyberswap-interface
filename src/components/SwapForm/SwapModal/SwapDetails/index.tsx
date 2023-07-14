import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ExternalLink as ExternalLinkIcon, Repeat } from 'react-feather'
import { NavLink } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { TruncatedText } from 'components'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { TooltipTextOfSwapFee } from 'components/SwapForm/TradeSummary'
import useCheckStablePairSwap from 'components/SwapForm/hooks/useCheckStablePairSwap'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { StyledBalanceMaxMini } from 'components/swapv2/styleds'
import { APP_PATHS, CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isSupportKyberDao, useGasRefundTier } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink, TYPE } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum, shortenAddress } from 'utils'
import { calculateFeeFromBuildData } from 'utils/fee'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

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

  const formattedPrice = showInverted ? executionPrice?.invert()?.toSignificant(6) : executionPrice?.toSignificant(6)
  const value = showInverted
    ? `1 ${outputSymbol} = ${formattedPrice} ${inputSymbol}`
    : `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`

  return (
    <Text fontWeight={500} style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}>
      {value}
    </Text>
  )
}

type Optional<T> = {
  [key in keyof T]: T[key] | undefined
}

export type Props = {
  isLoading: boolean
  buildData: BuildRouteData | undefined
  minimumAmountOut: CurrencyAmount<Currency> | undefined
} & Optional<Pick<DetailedRouteSummary, 'gasUsd' | 'executionPrice' | 'priceImpact'>>

export default function SwapDetails({
  isLoading,
  gasUsd,
  minimumAmountOut,
  executionPrice,
  priceImpact,
  buildData,
}: Props) {
  const { isEVM, chainId, networkInfo, account } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const { slippage, routeSummary } = useSwapFormContext()
  const { gasRefundPerCentage } = useGasRefundTier()

  const currencyIn = routeSummary?.parsedAmountIn?.currency
  const currencyOut = routeSummary?.parsedAmountOut?.currency

  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <Flex style={{ color: theme.text, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <TruncatedText style={{ width: '-webkit-fill-available' }}>
          {formattedNum(minimumAmountOut.toSignificant(10), false, 10)}
        </TruncatedText>
        <Text style={{ minWidth: 'auto' }}>&nbsp;{currencyOut.symbol}</Text>
      </Flex>
    ) : (
      ''
    )

  const priceImpactResult = checkPriceImpact(priceImpact)
  const isStablePair = useCheckStablePairSwap(currencyIn, currencyOut)

  const { formattedAmountUsd: feeAmountUsdFromGet = '' } = routeSummary?.fee || {}

  const {
    feeAmount: feeAmountFromBuild = '',
    feeAmountUsd: feeAmountUsdFromBuild = '',
    currency: currencyFromBuild = undefined,
  } = calculateFeeFromBuildData(routeSummary, buildData)

  const feeAmountWithSymbol =
    feeAmountFromBuild && currencyFromBuild?.symbol ? `${feeAmountFromBuild} ${currencyFromBuild.symbol}` : ''

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
                <TYPE.black fontSize={12}>--</TYPE.black>
              )
            }
          />
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <MouseoverTooltip
                width="200px"
                text={<Trans>You will receive at least this amount or your transaction will revert</Trans>}
                placement="right"
              >
                <Trans>Minimum Received</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '108px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={
              <TYPE.black fontSize={12} fontWeight={500}>
                {minimumAmountOutStr || '--'}
              </TYPE.black>
            }
          />
        </RowBetween>

        <RowBetween height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                text={
                  <div>
                    <Trans>Estimated change in price due to the size of your transaction.</Trans>
                    <Trans>
                      <Text fontSize={12}>
                        Read more{' '}
                        <a
                          href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <b>here ↗</b>
                        </a>
                      </Text>
                    </Trans>
                  </div>
                }
                placement="right"
              >
                <Trans>Price Impact</Trans>
              </MouseoverTooltip>
            </TextDashed>
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

        {isEVM && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip text={<Trans>Estimated network fee for your transaction</Trans>} placement="right">
                  <Trans>Est. Gas Fee</Trans>
                </MouseoverTooltip>
              </TextDashed>
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

        {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  text={
                    <TooltipTextOfSwapFee
                      feeAmountText={feeAmountWithSymbol}
                      feeBips={routeSummary?.extraFee?.feeAmount}
                    />
                  }
                  placement="right"
                >
                  <Trans>Est. Swap Fee</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>

            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '64px',
                height: '19px',
              }}
              isShowingSkeleton={isLoading}
              content={
                <Flex
                  sx={{
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    gap: '4px',
                  }}
                >
                  {buildData && feeAmountUsdFromGet !== feeAmountUsdFromBuild && (
                    <Flex
                      sx={{
                        background: rgba(theme.warning, 0.3),
                        color: theme.warning,
                        borderRadius: '36px',
                        fontSize: '10px',
                        lineHeight: '12px',
                        padding: '2px 4px',
                      }}
                    >
                      <Trans>Updated</Trans>
                    </Flex>
                  )}
                  <TYPE.black color={theme.text} fontWeight={500} fontSize={12}>
                    {feeAmountUsdFromBuild || feeAmountWithSymbol || '--'}
                  </TYPE.black>
                </Flex>
              }
            />
          </RowBetween>
        )}

        <RowBetween height="20px" style={{ gap: '16px' }}>
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

          <TYPE.black fontSize={12} color={checkWarningSlippage(slippage, isStablePair) ? theme.warning : undefined}>
            {formatSlippage(slippage)}
          </TYPE.black>
        </RowBetween>

        {isSupportKyberDao(chainId) && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  text={
                    <Text>
                      <Trans>
                        Stake KNC in KyberDAO to get gas refund. Read more{' '}
                        <ExternalLink href="https://docs.kyberswap.com/governance/knc-token/gas-refund-program">
                          here ↗
                        </ExternalLink>
                      </Trans>
                    </Text>
                  }
                  placement="right"
                >
                  <Trans>Gas Refund</Trans>
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>

            <ExternalLink href={APP_PATHS.KYBERDAO_KNC_UTILITY}>
              <ButtonLight padding="0px 8px" width="fit-content" fontSize={10} fontWeight={500} lineHeight="16px">
                <Trans>{account ? gasRefundPerCentage * 100 : '--'}% Refund</Trans>
              </ButtonLight>
            </ExternalLink>
          </RowBetween>
        )}

        <Divider />
        <RowBetween>
          <TextDashed fontSize={12} color={theme.subText}>
            <MouseoverTooltip text={<Trans>Chain on which the swap will be executed</Trans>}>
              <Trans>Chain</Trans>
            </MouseoverTooltip>
          </TextDashed>
          <Flex fontSize={12} fontWeight="501" alignItems="center" sx={{ gap: '4px' }}>
            <img
              src={isDarkMode && networkInfo.iconDark ? networkInfo.iconDark : networkInfo.icon}
              alt="network icon"
              width="12px"
              height="12px"
            />
            {networkInfo.name}
          </Flex>
        </RowBetween>

        <RowBetween>
          <TextDashed fontSize={12} color={theme.subText}>
            <MouseoverTooltip
              text={
                <Trans>
                  The contract address that will be executing the swap. You can verify the contract in the block
                  explorer
                </Trans>
              }
            >
              <Trans>Contract Address</Trans>
            </MouseoverTooltip>
          </TextDashed>
          {buildData?.routerAddress && (
            <Flex alignItems="center">
              <ExternalLink href={`${networkInfo.etherscanUrl}/address/${buildData.routerAddress}`}>
                <Flex color={theme.text} sx={{ gap: '4px' }}>
                  <Text fontSize={12}>{shortenAddress(chainId, buildData.routerAddress)}</Text>
                  <ExternalLinkIcon size={12} />
                </Flex>
              </ExternalLink>

              <CopyHelper toCopy={buildData.routerAddress} size="12px" />
            </Flex>
          )}
        </RowBetween>
      </AutoColumn>
    </>
  )
}
