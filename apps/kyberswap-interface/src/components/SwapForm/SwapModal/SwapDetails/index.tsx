import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type ComponentProps, type ReactNode, useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { TruncatedText } from 'components'
import Divider from 'components/Divider'
import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/AddMEVProtectionModal'
import { PriceAlertButton } from 'components/SwapForm/SlippageSettingGroup'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { SwapFeeLabel, TooltipTextOfSwapFee, formatSwapFeePercent } from 'components/SwapForm/TradeSummary'
import { TextHelper } from 'components/Text'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import usePageLocation from 'hooks/usePageLocation'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink, ExternalLinkNoLineHeight, MEDIA_WIDTHS } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { calculateFeeFromBuildData } from 'utils/fee'
import { formatDisplayNumber } from 'utils/numbers'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'
import { isInSafeApp } from 'utils/safeApp'
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

const DETAIL_ROW_CLASS = 'min-h-5 w-full items-center justify-between gap-4'
const LABEL_CLASS = 'text-xs text-subText'
const VALUE_CLASS = 'm-0 text-xs font-medium text-text'
const DETAIL_TOOLTIP_WIDTH = '200px'
const DETAIL_TOOLTIP_PLACEMENT: ComponentProps<typeof TextHelper>['placement'] = 'right'

const DetailLabel = ({
  className,
  placement = DETAIL_TOOLTIP_PLACEMENT,
  tooltipWidth = DETAIL_TOOLTIP_WIDTH,
  ...props
}: ComponentProps<typeof TextHelper>) => (
  <TextHelper
    fontSize={12}
    fontWeight={400}
    className={cn(LABEL_CLASS, className)}
    placement={placement}
    tooltipWidth={tooltipWidth}
    {...props}
  />
)

type DetailRowProps = {
  children: ReactNode
  className?: string
  isLoading?: boolean
  label: ReactNode
  skeletonWidth?: string
}

const DetailRow = ({ children, className, isLoading, label, skeletonWidth = '64px' }: DetailRowProps) => (
  <HStack className={cn(DETAIL_ROW_CLASS, className)}>
    <HStack className="w-fit min-w-max items-center">{label}</HStack>
    {isLoading === undefined ? (
      children
    ) : (
      <ValueWithLoadingSkeleton
        skeletonStyle={{
          width: skeletonWidth,
        }}
        isShowingSkeleton={isLoading}
        content={children}
      />
    )}
  </HStack>
)

const AddressLink = ({ children, href }: { children: ReactNode; href: string }) => (
  <ExternalLinkNoLineHeight href={href} className="text-text underline [text-decoration-style:dotted]">
    <span className="text-xs">{children}</span>
  </ExternalLinkNoLineHeight>
)

const GasBreakdown = ({
  additionalCostUsd,
  expanded,
  gasUsd,
}: {
  additionalCostUsd: string | undefined
  expanded: boolean
  gasUsd: string | undefined
}) => {
  if (!additionalCostUsd || additionalCostUsd === '0') {
    return null
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <Stack className="gap-2 pt-2">
          <HStack className="items-center justify-end gap-2">
            <DetailLabel placement="top" tooltip={<Trans>L2 execution fee</Trans>}>
              Est. L2 gas fee
            </DetailLabel>
            <p className={VALUE_CLASS}>
              {gasUsd && formatDisplayNumber(gasUsd, { style: 'currency', significantDigits: 5 })}
            </p>
          </HStack>

          <HStack className="items-center justify-end gap-2">
            <DetailLabel placement="top" tooltip={<Trans>L1 fee that pays for rolls up cost</Trans>}>
              Est. L1 gas fee
            </DetailLabel>
            <p className={VALUE_CLASS}>
              {formatDisplayNumber(additionalCostUsd, {
                style: 'currency',
                significantDigits: 5,
              })}
            </p>
          </HStack>
        </Stack>
      </div>
    </div>
  )
}

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
  const { isEmbeddedSwap } = usePageLocation()
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
    !isEmbeddedSwap &&
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
  const additionalCostUsd = buildData?.additionalCostUsd
  const hasAdditionalCost = Boolean(additionalCostUsd && additionalCostUsd !== '0')

  return (
    <>
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />

      <Stack className="gap-2 rounded-2xl border border-border px-4 py-3">
        <DetailRow
          isLoading={isLoading}
          skeletonWidth="108px"
          label={
            <DetailLabel
              tooltip={
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
            >
              <Trans>Minimum Receiving</Trans>
            </DetailLabel>
          }
        >
          <p className={VALUE_CLASS}>{minimumAmountOutText || '--'}</p>
        </DetailRow>

        <DetailRow
          isLoading={isLoading}
          skeletonWidth="108px"
          label={
            <span className="min-w-max text-xs text-subText">
              <Trans>Maximum Receiving</Trans>
            </span>
          }
        >
          <p className={VALUE_CLASS}>{maximumAmountOutText || '--'}</p>
        </DetailRow>

        <DetailRow
          isLoading={isLoading}
          label={
            <DetailLabel
              tooltip={
                <div>
                  <Trans>Estimated change in price due to the size of your transaction.</Trans>
                  <p className="m-0 text-xs">
                    <Trans>
                      Read more{' '}
                      <a
                        href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium"
                      >
                        here ↗
                      </a>
                    </Trans>
                  </p>
                </div>
              }
            >
              <Trans>Price Impact</Trans>
            </DetailLabel>
          }
        >
          <p
            className={cn(
              'm-0 text-xs font-medium',
              priceImpactResult.isVeryHigh ? 'text-red' : priceImpactResult.isHigh ? 'text-warning' : 'text-text',
            )}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </p>
        </DetailRow>

        <HStack className="min-h-5 w-full items-start justify-between gap-4">
          <HStack className="h-5 w-fit min-w-max items-center">
            <DetailLabel tooltip={<Trans>Estimated network fee for your transaction.</Trans>}>
              {t`Estimated Total Gas`}
            </DetailLabel>
          </HStack>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '64px',
            }}
            isShowingSkeleton={isLoading}
            content={
              <div className="flex flex-col items-end">
                <div
                  className={cn('flex h-5 items-center gap-1', hasAdditionalCost && 'cursor-pointer')}
                  onClick={() => hasAdditionalCost && setShowDetailGas(prev => !prev)}
                >
                  <p className={VALUE_CLASS}>
                    {gasUsd
                      ? formatDisplayNumber(+gasUsd + Number(buildData?.additionalCostUsd || 0), {
                          style: 'currency',
                          significantDigits: 5,
                        })
                      : '--'}
                  </p>
                  {hasAdditionalCost && (
                    <ChevronDown
                      className={cn('cursor-pointer text-subText transition-transform', showDetailGas && 'rotate-180')}
                      size={14}
                    />
                  )}
                </div>
                <GasBreakdown additionalCostUsd={additionalCostUsd} expanded={showDetailGas} gasUsd={gasUsd} />
              </div>
            }
          />
        </HStack>

        <DetailRow
          label={
            <DetailLabel
              tooltip={
                <p>
                  <Trans>
                    During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                      here ↗
                    </ExternalLink>
                  </Trans>
                </p>
              }
            >
              <Trans>Max Slippage</Trans>
            </DetailLabel>
          }
        >
          <p className={cn(VALUE_CLASS, checkWarningSlippage(slippage, cat) && 'text-warning')}>
            {formatSlippage(slippage)}
          </p>
        </DetailRow>

        {addMevButton && <div className="flex justify-end">{addMevButton}</div>}

        {isInSafeApp && !!feeAmount && feeAmount !== '0' && (
          <DetailRow
            isLoading={isLoading}
            label={
              <DetailLabel
                tooltip={
                  <p>
                    Learn more about the Platform Fee{' '}
                    <ExternalLink href="https://docs.kyberswap.com/">here ↗</ExternalLink>
                  </p>
                }
              >
                Platform Fee
              </DetailLabel>
            }
          >
            <p className={VALUE_CLASS}>0.1%</p>
          </DetailRow>
        )}

        {!isInSafeApp && !!feeAmount && feeAmount !== '0' && (
          <DetailRow
            isLoading={isLoading}
            label={
              <HStack className="w-fit items-center gap-1">
                <DetailLabel tooltip={<TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={feeAmount} />}>
                  <SwapFeeLabel />
                </DetailLabel>
                {isFeeUpdated && (
                  <div className="flex rounded-[36px] bg-warning/30 px-1 py-0.5 text-[10px] leading-3 text-warning">
                    <Trans>Updated</Trans>
                  </div>
                )}
              </HStack>
            }
          >
            <p className="m-0 flex flex-nowrap items-center gap-1 text-right text-xs font-medium">
              <span className="text-text">{feePercent || '--'}</span>
              {feeAmountUsdText && <span className="text-subText">(~{feeAmountUsdText})</span>}
            </p>
          </DetailRow>
        )}

        <Divider />
        {recipient && (
          <DetailRow
            label={
              <span className={LABEL_CLASS}>
                <Trans>Recipient</Trans>
              </span>
            }
          >
            <div className="flex items-center gap-1 text-xs font-medium">
              <img src={networkInfo.icon} alt="network icon" width="12px" height="12px" />
              <AddressLink href={`${networkInfo.etherscanUrl}/address/${recipient}`}>
                {shortenAddress(chainId, recipient)}
              </AddressLink>
            </div>
          </DetailRow>
        )}

        <DetailRow
          label={
            <DetailLabel
              tooltip={
                <Trans>
                  The contract address that will be executing the swap. You can verify the contract in the block
                  explorer.
                </Trans>
              }
            >
              <Trans>Contract Address</Trans>
            </DetailLabel>
          }
        >
          {buildData?.routerAddress && (
            <div className="flex items-center">
              <AddressLink href={`${networkInfo.etherscanUrl}/address/${buildData.routerAddress}`}>
                {shortenAddress(chainId, buildData.routerAddress)}
              </AddressLink>
            </div>
          )}
        </DetailRow>
      </Stack>
    </>
  )
}
