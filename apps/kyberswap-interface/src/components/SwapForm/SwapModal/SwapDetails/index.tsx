import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { TruncatedText } from 'components'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/AddMEVProtectionModal'
import { PriceAlertButton } from 'components/SwapForm/SlippageSettingGroup'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { SwapFeeLabel, TooltipTextOfSwapFee, formatSwapFeePercent } from 'components/SwapForm/TradeSummary'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import usePageLocation from 'hooks/usePageLocation'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { isInSafeApp, shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { calculateFeeFromBuildData } from 'utils/fee'
import { formatDisplayNumber } from 'utils/numbers'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'
import { SLIPPAGE_STATUS, checkRangeSlippage, checkWarningSlippage, formatSlippage } from 'utils/slippage'

type Optional<T> = {
  [key in keyof T]: T[key] | undefined
}

const CurrencyAmountText = ({ amount }: { amount: CurrencyAmount<Currency> }) => (
  <div className="flex whitespace-nowrap font-medium text-text">
    <TruncatedText style={{ width: '-webkit-fill-available' }}>
      {formatDisplayNumber(amount.toSignificant(10), { significantDigits: 10 })}
    </TruncatedText>
    <span>&nbsp;{amount.currency.symbol}</span>
  </div>
)

export type Props = {
  isLoading: boolean
  buildData: BuildRouteData | undefined
  minimumAmountOut: CurrencyAmount<Currency> | undefined
} & Optional<Pick<DetailedRouteSummary, 'gasUsd' | 'executionPrice' | 'priceImpact'>>

export default function SwapDetails({ isLoading, gasUsd, minimumAmountOut, priceImpact, buildData }: Props) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const { active } = useWeb3React()
  const { slippage, routeSummary, recipient: recipientAddressOrName } = useSwapFormContext()
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const { rawSlippage } = useSlippageSettingByPage()
  const { isPartnerSwap } = usePageLocation()
  const { trackingHandler } = useTracking()
  const cat = usePairCategory()
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const [showMevModal, setShowMevModal] = useState(false)
  const [showDetailGas, setShowDetailGas] = useState(false)

  const currencyOut = routeSummary?.parsedAmountOut?.currency
  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildData?.amountOut || '0')

  const minimumAmountOutText = minimumAmountOut ? <CurrencyAmountText amount={minimumAmountOut} /> : ''
  const maximumAmountOutText = amountOut ? <CurrencyAmountText amount={amountOut} /> : ''

  const priceImpactResult = checkPriceImpact(priceImpact)

  const feeCurrencyAmountFromGet = routeSummary?.fee?.currencyAmount
  const {
    feeAmount: feeAmountFromBuild = '',
    currencyAmount: feeCurrencyAmountFromBuild = undefined,
    currency: currencyFromBuild = undefined,
  } = calculateFeeFromBuildData(routeSummary, buildData)

  const feeAmount = routeSummary?.extraFee?.feeAmount
  const feeAmountWithSymbol =
    feeAmountFromBuild && currencyFromBuild?.symbol ? `${feeAmountFromBuild} ${currencyFromBuild.symbol}` : ''
  const feePercent = formatSwapFeePercent(feeAmount)
  const isFeeUpdated = Boolean(
    buildData &&
      feeCurrencyAmountFromGet &&
      feeCurrencyAmountFromBuild &&
      feeCurrencyAmountFromGet.toExact() !== feeCurrencyAmountFromBuild.toExact(),
  )

  const feeTokenAddress = currencyFromBuild?.wrapped.address
  const tokenPrices = useTokenPrices(feeTokenAddress ? [feeTokenAddress] : [], currencyFromBuild?.chainId)
  const feeTokenPrice = feeTokenAddress ? tokenPrices[feeTokenAddress] : 0
  const feeAmountUsdText =
    feeCurrencyAmountFromBuild && feeTokenPrice
      ? formatDisplayNumber(Number(feeCurrencyAmountFromBuild.toExact()) * feeTokenPrice, {
          style: 'currency',
          significantDigits: 4,
        })
      : ''

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress
  const slippageStatus = checkRangeSlippage(rawSlippage, cat)

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    trackingHandler(TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV)
  }, [trackingHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const addMevButton =
    KYBER_SWAP_RPC[chainId] &&
    active &&
    !isPartnerSwap &&
    slippageStatus === SLIPPAGE_STATUS.HIGH &&
    !isMobile &&
    !isTablet ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} className="text-subText" />
        <span className="inline-flex items-center whitespace-nowrap leading-[normal] text-subText">
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
          <InfoHelper size={14} text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>} />
        </span>
      </PriceAlertButton>
    ) : null

  return (
    <>
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />

      <AutoColumn className="gap-2 rounded-2xl border border-border px-4 py-3">
        <RowBetween className="h-5 items-center gap-4">
          <RowFixed className="min-w-max">
            <TextDashed fontSize={12} fontWeight={400} className="text-subText" minWidth="max-content">
              <MouseoverTooltip
                width="200px"
                text={
                  <>
                    <p>
                      <Trans>You will receive at least this amount, or your transaction will revert.</Trans>
                    </p>
                    <p>
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
                    </p>
                  </>
                }
                placement="right"
              >
                <Trans>Minimum Receiving</Trans>
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
              <p className="m-0 text-[12px] font-medium leading-[normal] text-text">{minimumAmountOutText || '--'}</p>
            }
          />
        </RowBetween>

        <RowBetween className="h-5 items-center gap-4">
          <RowFixed className="min-w-max">
            <span className="min-w-max text-[12px] font-normal leading-[normal] text-subText">
              <Trans>Maximum Receiving</Trans>
            </span>
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '108px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={
              <p className="m-0 text-[12px] font-medium leading-[normal] text-text">{maximumAmountOutText || '--'}</p>
            }
          />
        </RowBetween>

        <RowBetween className="h-5 gap-4">
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip
                text={
                  <div>
                    <Trans>Estimated change in price due to the size of your transaction.</Trans>
                    <p className="m-0 text-[12px] leading-[normal]">
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
                    </p>
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
              <p
                className={cn(
                  'm-0 text-[12px] font-medium leading-[normal]',
                  priceImpactResult.isVeryHigh ? 'text-red' : priceImpactResult.isHigh ? 'text-warning' : 'text-text',
                )}
              >
                {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
              </p>
            }
          />
        </RowBetween>

        <RowBetween className="items-start gap-4">
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip text={<Trans>Estimated network fee for your transaction.</Trans>} placement="right">
                {t`Estimated Total Gas`}
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '64px',
              height: isLoading ? '19px' : 'max-content',
            }}
            isShowingSkeleton={isLoading}
            content={
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1" onClick={() => setShowDetailGas(prev => !prev)}>
                  <p className="m-0 text-[12px] font-medium leading-[normal] text-text">
                    {gasUsd
                      ? formatDisplayNumber(+gasUsd + Number(buildData?.additionalCostUsd || 0), {
                          style: 'currency',
                          significantDigits: 5,
                        })
                      : '--'}
                  </p>
                  {buildData?.additionalCostUsd && buildData?.additionalCostUsd !== '0' && (
                    <ChevronDown
                      className={cn('cursor-pointer text-subText', showDetailGas && 'rotate-180')}
                      size={14}
                    />
                  )}
                </div>
                {showDetailGas && buildData?.additionalCostUsd && buildData?.additionalCostUsd !== '0' && (
                  <>
                    <div className="mr-[18px] flex gap-2">
                      <RowFixed>
                        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                          <MouseoverTooltip text={<Trans>L2 execution fee</Trans>} placement="right">
                            Est. L2 gas fee
                          </MouseoverTooltip>
                        </TextDashed>
                      </RowFixed>
                      <div className="flex gap-1">
                        <p className="m-0 text-[12px] font-medium leading-[normal] text-text">
                          {gasUsd && formatDisplayNumber(gasUsd, { style: 'currency', significantDigits: 5 })}
                        </p>
                      </div>
                    </div>

                    <div className="mr-[18px] flex gap-2">
                      <RowFixed>
                        <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                          <MouseoverTooltip text={<Trans>L1 fee that pays for rolls up cost</Trans>} placement="right">
                            Est. L1 gas fee
                          </MouseoverTooltip>
                        </TextDashed>
                      </RowFixed>
                      <div className="flex gap-1">
                        <p className="m-0 text-[12px] font-medium leading-[normal] text-text">
                          {formatDisplayNumber(buildData.additionalCostUsd, {
                            style: 'currency',
                            significantDigits: 5,
                          })}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            }
          />
        </RowBetween>

        <RowBetween className={cn('items-start gap-4', addMevButton !== null ? 'h-[45px]' : 'h-5')}>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip
                text={
                  <p>
                    <Trans>
                      During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                      <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                        here ↗
                      </ExternalLink>
                    </Trans>
                  </p>
                }
                placement="right"
              >
                <Trans>Max Slippage</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>

          <div className="flex flex-col items-end gap-1.5">
            <p
              className={cn(
                'm-0 text-[12px] font-medium leading-[normal] text-text',
                checkWarningSlippage(slippage, cat) && 'text-warning',
              )}
            >
              {formatSlippage(slippage)}
            </p>
            {addMevButton}
          </div>
        </RowBetween>

        {isInSafeApp && !!feeAmount && feeAmount !== '0' && (
          <RowBetween className="h-5 gap-4">
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                <MouseoverTooltip
                  text={
                    <p>
                      Learn more about the Platform Fee{' '}
                      <ExternalLink href="https://docs.kyberswap.com/">here ↗</ExternalLink>
                    </p>
                  }
                  placement="right"
                >
                  Platform Fee
                </MouseoverTooltip>
              </TextDashed>
            </RowFixed>

            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '64px',
                height: '19px',
              }}
              isShowingSkeleton={isLoading}
              content={<p className="m-0 text-[12px] font-medium leading-[normal] text-text">0.1%</p>}
            />
          </RowBetween>
        )}

        {!isInSafeApp && !!feeAmount && feeAmount !== '0' && (
          <RowBetween className="items-start gap-4">
            <RowFixed className="items-center gap-1">
              <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                <MouseoverTooltip
                  text={<TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={feeAmount} />}
                  placement="right"
                >
                  <SwapFeeLabel />
                </MouseoverTooltip>
              </TextDashed>
              {isFeeUpdated && (
                <div className="flex rounded-[36px] bg-warning/30 px-1 py-0.5 text-[10px] leading-3 text-warning">
                  <Trans>Updated</Trans>
                </div>
              )}
            </RowFixed>

            <ValueWithLoadingSkeleton
              skeletonStyle={{
                width: '64px',
                height: '19px',
              }}
              isShowingSkeleton={isLoading}
              content={
                <p className="m-0 flex flex-nowrap items-center gap-1 text-right text-[12px] font-medium leading-[normal]">
                  <span className="text-text">{feePercent || '--'}</span>
                  {feeAmountUsdText && <span className="text-subText">(~{feeAmountUsdText})</span>}
                </p>
              }
            />
          </RowBetween>
        )}

        <Divider />
        {recipient && (
          <RowBetween>
            <span className="text-[12px] leading-[normal] text-subText">
              <Trans>Recipient</Trans>
            </span>
            <div className="flex items-center gap-1 text-[12px] font-medium leading-[normal]">
              <img src={networkInfo.icon} alt="network icon" width="12px" height="12px" />
              <ExternalLink
                href={`${networkInfo.etherscanUrl}/address/${recipient}`}
                className="text-text underline [text-decoration-style:dotted]"
              >
                <span className="text-[12px] leading-[normal]">{shortenAddress(chainId, recipient)}</span>
              </ExternalLink>
            </div>
          </RowBetween>
        )}

        <RowBetween>
          <TextDashed fontSize={12} className="text-subText">
            <MouseoverTooltip
              text={
                <Trans>
                  The contract address that will be executing the swap. You can verify the contract in the block
                  explorer.
                </Trans>
              }
            >
              <Trans>Contract Address</Trans>
            </MouseoverTooltip>
          </TextDashed>
          {buildData?.routerAddress && (
            <div className="flex items-center">
              <ExternalLink
                href={`${networkInfo.etherscanUrl}/address/${buildData.routerAddress}`}
                className="text-text underline [text-decoration-style:dotted]"
              >
                <span className="text-[12px] leading-[normal]">{shortenAddress(chainId, buildData.routerAddress)}</span>
              </ExternalLink>
            </div>
          )}
        </RowBetween>
      </AutoColumn>
    </>
  )
}
