import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { TruncatedText } from 'components'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { RowBetween, RowFixed } from 'components/Row'
import AddMEVProtectionModal from 'components/SwapForm/AddMEVProtectionModal'
import { PriceAlertButton } from 'components/SwapForm/SlippageSettingGroup'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { TooltipTextOfSwapFee } from 'components/SwapForm/TradeSummary'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { usePairCategory } from 'state/swap/hooks'
import { usePaymentToken, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS, TYPE } from 'theme'
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
      <Flex style={{ color: theme.text, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <TruncatedText style={{ width: '-webkit-fill-available' }}>
          {formattedNum(minimumAmountOut.toSignificant(10), false, 10)}
        </TruncatedText>
        <Text style={{ minWidth: 'auto' }}>&nbsp;{currencyOut.symbol}</Text>
      </Flex>
    ) : (
      ''
    )

  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildData?.amountOut || '0')
  const maximumAmountOutStr = amountOut && (
    <Flex style={{ color: theme.text, fontWeight: 500, whiteSpace: 'nowrap' }}>
      <TruncatedText style={{ width: '-webkit-fill-available' }}>
        {formattedNum(amountOut.toSignificant(10), false, 10)}
      </TruncatedText>
      <Text style={{ minWidth: 'auto' }}>&nbsp;{currencyOut.symbol}</Text>
    </Flex>
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

  const { mixpanelHandler } = useMixpanel()

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    mixpanelHandler(MIXPANEL_TYPE.MEV_CLICK_ADD_MEV)
  }, [mixpanelHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const [showDetailGas, setShowDetailGas] = useState(false)

  const { rawSlippage } = useSlippageSettingByPage()
  const slippageStatus = checkRangeSlippage(rawSlippage, cat)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const isPartnerSwap = window.location.pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const addMevButton =
    chainId === ChainId.MAINNET &&
    active &&
    !isPartnerSwap &&
    slippageStatus === SLIPPAGE_STATUS.HIGH &&
    !isMobile &&
    !isTablet ? (
      <PriceAlertButton onClick={addMevProtectionHandler}>
        <Shield size={14} color={theme.subText} />
        <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
          {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
          <InfoHelper size={14} text="Add MEV Protection to safeguard you from front-running attacks." />
        </Text>
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
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <MouseoverTooltip
                width="200px"
                text={<Trans>You will receive at least this amount or your transaction will revert.</Trans>}
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

        <RowBetween style={{ gap: '16px' }} align="flex-start">
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip text={<Trans>Estimated network fee for your transaction.</Trans>} placement="right">
                {paymentToken ? 'Est. Paymaster Gas Fee' : 'Estimated Total Gas'}
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
              <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
                <Flex sx={{ gap: '4px' }} onClick={() => setShowDetailGas(prev => !prev)}>
                  {isHold && !!gasUsd && (
                    <Text sx={{ textDecoration: 'line-through' }} fontSize={12} color={theme.subText}>
                      {formattedNum(gasUsd, true)}
                    </Text>
                  )}
                  <TYPE.black color={theme.text} fontSize={12}>
                    {gasUsd
                      ? formattedNum(isHold ? +gasUsd * 0.8 : +gasUsd + Number(buildData?.additionalCostUsd || 0), true)
                      : '--'}
                  </TYPE.black>
                  {buildData?.additionalCostUsd && buildData?.additionalCostUsd !== '0' && (
                    <ChevronDown
                      color={theme.subText}
                      size={14}
                      style={{
                        transform: `rotate(${showDetailGas ? '180deg' : '0deg'})`,
                        cursor: 'pointer',
                      }}
                    />
                  )}
                </Flex>
                {showDetailGas && buildData?.additionalCostUsd && buildData?.additionalCostUsd !== '0' && (
                  <>
                    <Flex sx={{ gap: '8px' }} mr="18px">
                      <RowFixed>
                        <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                          <MouseoverTooltip text={<Trans>L2 execution fee</Trans>} placement="right">
                            Est. L2 gas fee
                          </MouseoverTooltip>
                        </TextDashed>
                      </RowFixed>
                      <Flex sx={{ gap: '4px' }}>
                        <TYPE.black color={theme.text} fontSize={12}>
                          {gasUsd && formattedNum(gasUsd, true)}
                        </TYPE.black>
                      </Flex>
                    </Flex>

                    <Flex sx={{ gap: '8px' }} mr="18px">
                      <RowFixed>
                        <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                          <MouseoverTooltip text={<Trans>L1 fee that pays for rolls up cost</Trans>} placement="right">
                            Est. L1 gas fee
                          </MouseoverTooltip>
                        </TextDashed>
                      </RowFixed>
                      <Flex sx={{ gap: '4px' }}>
                        <TYPE.black color={theme.text} fontSize={12}>
                          {formattedNum(buildData.additionalCostUsd, true)}
                        </TYPE.black>
                      </Flex>
                    </Flex>
                  </>
                )}
              </Flex>
            }
          />
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
            <Text fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <Trans>Maximum Receiving</Trans>
            </Text>
          </RowFixed>

          <ValueWithLoadingSkeleton
            skeletonStyle={{
              width: '108px',
              height: '19px',
            }}
            isShowingSkeleton={isLoading}
            content={
              <TYPE.black fontSize={12} fontWeight={500}>
                {maximumAmountOutStr || '--'}
              </TYPE.black>
            }
          />
        </RowBetween>

        {!!feeAmount && feeAmount !== '0' && (
          <RowBetween height="20px" style={{ gap: '16px' }}>
            <RowFixed>
              <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
                <MouseoverTooltip
                  text={
                    isInSafeApp ? (
                      <Text>
                        Learn more about the Platform Fee{' '}
                        <ExternalLink href="https://docs.kyberswap.com/">here ↗</ExternalLink>
                      </Text>
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
                    {isInSafeApp ? '0.1%' : feeAmountUsdFromBuild || feeAmountWithSymbol || '--'}
                  </TYPE.black>
                </Flex>
              }
            />
          </RowBetween>
        )}

        <RowBetween height={addMevButton !== null ? '45px' : '20px'} style={{ gap: '16px' }} align="flex-start">
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

          <Flex flexDirection={'column'} alignItems={'flex-end'} sx={{ gap: '6px' }}>
            <TYPE.black fontSize={12} color={checkWarningSlippage(slippage, cat) ? theme.warning : undefined}>
              {formatSlippage(slippage)}
            </TYPE.black>
            {addMevButton}
          </Flex>
        </RowBetween>

        <Divider />
        {recipient && (
          <RowBetween>
            <Text fontSize={12} color={theme.subText}>
              <Trans>Recipient</Trans>
            </Text>
            <Flex fontSize={12} fontWeight="501" alignItems="center" sx={{ gap: '4px' }}>
              <img src={networkInfo.icon} alt="network icon" width="12px" height="12px" />
              <ExternalLink
                href={`${networkInfo.etherscanUrl}/address/${recipient}`}
                style={{ textDecoration: 'underline', color: theme.text }}
              >
                <Text fontSize={12}>{shortenAddress(chainId, recipient)}</Text>
              </ExternalLink>
            </Flex>
          </RowBetween>
        )}

        <RowBetween>
          <TextDashed fontSize={12} color={theme.subText}>
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
            <Flex alignItems="center">
              <ExternalLink
                href={`${networkInfo.etherscanUrl}/address/${buildData.routerAddress}`}
                style={{ textDecoration: 'underline', color: theme.text }}
              >
                <Text fontSize={12}>{shortenAddress(chainId, buildData.routerAddress)}</Text>
              </ExternalLink>
            </Flex>
          )}
        </RowBetween>
      </AutoColumn>
    </>
  )
}
