import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { useMedia } from 'react-use'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { TruncatedText } from 'components'
import { Shield } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { Stack } from 'components/Stack'
import AddMEVProtectionModal, { KYBER_SWAP_RPC } from 'components/SwapForm/Settings/AddMEVProtectionModal'
import { PriceAlertButton } from 'components/SwapForm/Settings/MEVProtection'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { DetailLabel, DetailRow } from 'components/SwapForm/SwapModal/SwapDetails/DetailRow'
import { SwapFeeAndRecipientDetails, SwapGasDetails } from 'components/SwapForm/SwapModal/SwapDetails/SwapCosts'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { getERC8056DisplayAmount } from 'hooks/useERC8056Token'
import usePageLocation from 'hooks/usePageLocation'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePairCategory } from 'state/swap/hooks'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'
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

const SwapDetails = ({ isLoading, gasUsd, minimumAmountOut, priceImpact, buildData }: Props) => {
  const { chainId } = useActiveWeb3React()
  const { active } = useWeb3React()
  const { slippage, routeSummary, outputERC8056Info } = useSwapFormContext()
  const { rawSlippage } = useSlippageSettingByPage()
  const { isEmbeddedSwap } = usePageLocation()
  const { trackingHandler } = useTracking()
  const cat = usePairCategory()
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)

  const [showMevModal, setShowMevModal] = useState(false)

  const currencyOut = routeSummary?.parsedAmountOut?.currency
  const amountOut =
    currencyOut &&
    getERC8056DisplayAmount(outputERC8056Info, CurrencyAmount.fromRawAmount(currencyOut, buildData?.amountOut || '0'))

  const priceImpactResult = checkPriceImpact(priceImpact)

  const slippageStatus = checkRangeSlippage(rawSlippage, cat)

  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
    trackingHandler(TRACKING_EVENT_TYPE.MEV_CLICK_ADD_MEV)
  }, [trackingHandler])

  const onClose = useCallback(() => {
    setShowMevModal(false)
  }, [])

  const showMevProtection =
    KYBER_SWAP_RPC[chainId] &&
    active &&
    !isEmbeddedSwap &&
    slippageStatus === SLIPPAGE_STATUS.HIGH &&
    !isMobile &&
    !isTablet
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
          <div className="text-xs font-medium text-text">
            {minimumAmountOut ? <CurrencyAmountText amount={minimumAmountOut} /> : '--'}
          </div>
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
          <div className="text-xs font-medium text-text">
            {amountOut ? <CurrencyAmountText amount={amountOut} /> : '--'}
          </div>
        </DetailRow>

        <DetailRow
          isLoading={isLoading}
          label={
            <DetailLabel
              tooltip={
                <div>
                  <Trans>Estimated change in price due to the size of your transaction.</Trans>
                  <p className="text-xs">
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
              'text-xs font-medium',
              priceImpactResult.isVeryHigh ? 'text-red' : priceImpactResult.isHigh ? 'text-warning' : 'text-text',
            )}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </p>
        </DetailRow>

        <SwapGasDetails isLoading={isLoading} gasUsd={gasUsd} buildData={buildData} />

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
          <p className={cn('text-xs font-medium text-text', checkWarningSlippage(slippage, cat) && 'text-warning')}>
            {formatSlippage(slippage)}
          </p>
        </DetailRow>

        {showMevProtection && (
          <div className="flex justify-end">
            <PriceAlertButton onClick={addMevProtectionHandler}>
              <Shield size={14} className="text-subText" />
              <span className="inline-flex items-center whitespace-nowrap leading-[normal] text-subText">
                {upToXXSmall ? <Trans>MEV Protection</Trans> : <Trans>Add MEV Protection</Trans>}
                <InfoHelper
                  size={14}
                  text={<Trans>Add MEV Protection to safeguard you from front-running attacks.</Trans>}
                />
              </span>
            </PriceAlertButton>
          </div>
        )}

        <SwapFeeAndRecipientDetails isLoading={isLoading} buildData={buildData} />
      </Stack>
    </>
  )
}

export default SwapDetails
