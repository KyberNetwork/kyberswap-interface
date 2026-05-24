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
import { TooltipTextOfSwapFee } from 'components/SwapForm/TradeSummary'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { usePaymentToken, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum, isInSafeApp, shortenAddress } from 'utils'
import { calculateFeeFromBuildData } from 'utils/fee'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'
import { SLIPPAGE_STATUS, checkRangeSlippage, checkWarningSlippage, formatSlippage } from 'utils/slippage'

type Optional<T> = {
  [key in keyof T]: T[key] | undefined
}

export type Props = {
  isLoading: boolean
  buildData: BuildRouteData | undefined
  minimumAmountOut: CurrencyAmount<Currency> | undefined
} & Optional<Pick<DetailedRouteSummary, 'gasUsd' | 'executionPrice' | 'priceImpact'>>

export default function SwapDetails({ isLoading, gasUsd, minimumAmountOut, priceImpact, buildData }: Props) {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const { active } = useWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const theme = useTheme()
  const { slippage, routeSummary } = useSwapFormContext()

  const currencyOut = routeSummary?.parsedAmountOut?.currency

  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <div className="flex whitespace-nowrap font-medium text-text">
        <TruncatedText style={{ width: '-webkit-fill-available' }}>
          {formattedNum(minimumAmountOut.toSignificant(10), false, 10)}
        </TruncatedText>
        <span>&nbsp;{currencyOut.symbol}</span>
      </div>
    ) : (
      ''
    )

  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildData?.amountOut || '0')
  const maximumAmountOutStr = amountOut && (
    <div className="flex whitespace-nowrap font-medium text-text">
      <TruncatedText style={{ width: '-webkit-fill-available' }}>
        {formattedNum(amountOut.toSignificant(10), false, 10)}
      </TruncatedText>
      <span>&nbsp;{currencyOut.symbol}</span>
    </div>
  )

  const priceImpactResult = checkPriceImpact(priceImpact)
  const cat = usePairCategory()

  const { formattedAmountUsd: feeAmountUsdFromGet = '' } = routeSummary?.fee || {}

  const {
    feeAmount: feeAmountFromBuild = '',
    feeAmountUsd: feeAmountUsdFromBuild = '',
    currency: currencyFromBuild = undefined,
  } = calculateFeeFromBuildData(routeSummary, buildData)

  const feeAmountWithSymbol =
    feeAmountFromBuild && currencyFromBuild?.symbol ? `${feeAmountFromBuild} ${currencyFromBuild.symbol}` : ''

  const feeAmount = routeSummary?.extraFee?.feeAmount

  const [paymentToken] = usePaymentToken()
  const isHold = paymentToken?.address.toLowerCase() === '0xed4040fD47629e7c8FBB7DA76bb50B3e7695F0f2'.toLowerCase()

  const { recipient: recipientAddressOrName } = useSwapFormContext()
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const { trackingHandler } = useTracking()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    trackingHandler(TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV)
  }, [trackingHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const [showDetailGas, setShowDetailGas] = useState(false)

  const { rawSlippage } = useSlippageSettingByPage()
  const slippageStatus = checkRangeSlippage(rawSlippage, cat)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const addMevButton =
    KYBER_SWAP_RPC[chainId] &&
    active &&
    !isPartnerSwap &&
    slippageStatus === SLIPPAGE_STATUS.HIGH &&
    !isMobile &&
    !isTablet ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} className="text-subText" />
        <span className="whitespace-nowrap text-subText">
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
          <InfoHelper size={14} text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>} />
        </span>
      </PriceAlertButton>
    ) : null

  return (
    <>
      <AddMEVProtectionModal isOpen={showMevModal} onClose={onClose} />

      <AutoColumn
        gap="0.5rem"
        style={{ padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '16px' }}
      >
        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
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
              <p className="m-0 text-[12px] font-medium leading-[normal] text-text">{minimumAmountOutStr || '--'}</p>
            }
          />
        </RowBetween>

        <RowBetween height="20px" style={{ gap: '16px' }}>
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
                className="m-0 text-[12px] font-medium leading-[normal]"
                style={{
                  color: priceImpactResult.isVeryHigh
                    ? theme.red
                    : priceImpactResult.isHigh
                    ? theme.warning
                    : theme.text,
                }}
              >
                {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
              </p>
            }
          />
        </RowBetween>

        <RowBetween style={{ gap: '16px' }} align="flex-start">
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip text={<Trans>Estimated network fee for your transaction.</Trans>} placement="right">
                {paymentToken ? t`Est. Paymaster Gas Fee` : t`Estimated Total Gas`}
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
                  {isHold && !!gasUsd && (
                    <span className="text-[12px] leading-[normal] text-subText line-through">
                      {formattedNum(gasUsd, true)}
                    </span>
                  )}
                  <p className="m-0 text-[12px] font-medium leading-[normal] text-text">
                    {gasUsd
                      ? formattedNum(isHold ? +gasUsd * 0.8 : +gasUsd + Number(buildData?.additionalCostUsd || 0), true)
                      : '--'}
                  </p>
                  {buildData?.additionalCostUsd && buildData?.additionalCostUsd !== '0' && (
                    <ChevronDown
                      className="text-subText"
                      size={14}
                      style={{
                        transform: `rotate(${showDetailGas ? '180deg' : '0deg'})`,
                        cursor: 'pointer',
                      }}
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
                          {gasUsd && formattedNum(gasUsd, true)}
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
                          {formattedNum(buildData.additionalCostUsd, true)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            }
          />
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
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
              <p className="m-0 text-[12px] font-medium leading-[normal] text-text">{maximumAmountOutStr || '--'}</p>
            }
          />
        </RowBetween>

        {!!feeAmount && feeAmount !== '0' && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} className="text-subText">
                <MouseoverTooltip
                  text={
                    isInSafeApp ? (
                      <p>
                        Learn more about the Platform Fee{' '}
                        <ExternalLink href="https://docs.kyberswap.com/">here ↗</ExternalLink>
                      </p>
                    ) : (
                      <TooltipTextOfSwapFee
                        feeAmountText={feeAmountWithSymbol}
                        feeBips={routeSummary?.extraFee?.feeAmount}
                      />
                    )
                  }
                  placement="right"
                >
                  {isInSafeApp ? 'Platform Fee' : <Trans>Est. Swap Fee</Trans>}
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
                <div className="flex flex-nowrap items-center gap-1">
                  {buildData && feeAmountUsdFromGet !== feeAmountUsdFromBuild && (
                    <div className="flex rounded-[36px] bg-warning/30 px-1 py-0.5 text-[10px] leading-3 text-warning">
                      <Trans>Updated</Trans>
                    </div>
                  )}
                  <p className="m-0 text-[12px] font-medium leading-[normal] text-text">
                    {isInSafeApp ? '0.1%' : feeAmountUsdFromBuild || feeAmountWithSymbol || '--'}
                  </p>
                </div>
              }
            />
          </RowBetween>
        )}

        <RowBetween height={addMevButton !== null ? '45px' : '20px'} style={{ gap: '16px' }} align="flex-start">
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
              className="m-0 text-[12px] font-medium leading-[normal] text-text"
              style={checkWarningSlippage(slippage, cat) ? { color: theme.warning } : undefined}
            >
              {formatSlippage(slippage)}
            </p>
            {addMevButton}
          </div>
        </RowBetween>

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
                className="text-text"
                style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}
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
                className="text-text"
                style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}
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
