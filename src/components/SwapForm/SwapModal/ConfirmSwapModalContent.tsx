import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React, { useState } from 'react'
import { AlertTriangle, Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import { calculatePriceImpact } from 'services/route/utils'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import WarningNote from 'components/WarningNote'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useEncodeSolana } from 'state/swap/hooks'
import { CloseIcon } from 'theme/components'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { checkPriceImpact } from 'utils/prices'
import { checkWarningSlippage } from 'utils/slippage'

import SwapBrief from './SwapBrief'
import SwapDetails, { Props as SwapDetailsProps } from './SwapDetails'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px;
  gap: 16px;
  border-radius: 20px;
`

const PriceUpdateWarning = styled.div<{ isAccepted: boolean; $level: 'warning' | 'error' }>`
  margin-top: 1rem;
  border-radius: 999px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: ${({ $level, theme, isAccepted }) =>
    isAccepted
      ? transparentize(0.8, theme.subText)
      : $level === 'warning'
      ? transparentize(0.7, theme.warning)
      : transparentize(0.7, theme.red)};
  color: ${({ theme, isAccepted }) => (isAccepted ? theme.subText : theme.text)};
`

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
}

export default function ConfirmSwapModalContent({
  buildResult,
  isBuildingRoute,
  errorWhileBuildRoute,
  onDismiss,
  onSwap,
}: Props) {
  const theme = useTheme()
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const { routeSummary, slippage, isStablePairSwap, isAdvancedMode } = useSwapFormContext()
  const [hasAcceptedNewPrice, setHasAcceptedNewPrice] = useState(false)

  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute
  const isWarningSlippage = checkWarningSlippage(slippage, isStablePairSwap)

  const priceImpactFromBuild = buildResult?.data
    ? calculatePriceImpact(Number(buildResult?.data?.amountInUsd || 0), Number(buildResult?.data?.amountOutUsd || 0))
    : undefined

  const priceImpactResult = checkPriceImpact(priceImpactFromBuild)

  const outputAmountChange = Number(buildResult?.data?.outputChange?.amount) || 0

  const getSwapDetailsProps = (): SwapDetailsProps => {
    if (!buildResult?.data || !routeSummary) {
      return {
        isLoading: isBuildingRoute,

        gasUsd: undefined,
        executionPrice: undefined,
        parsedAmountOut: undefined,
        amountInUsd: undefined,
        priceImpact: undefined,
      }
    }

    const { amountIn, amountInUsd, amountOut, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )

    return {
      isLoading: isBuildingRoute,

      gasUsd,
      executionPrice,
      parsedAmountOut,
      amountInUsd,
      priceImpact: priceImpactFromBuild,
    }
  }

  const renderSwapBrief = () => {
    if (!routeSummary) {
      return null
    }

    const { parsedAmountIn, parsedAmountOut, amountInUsd } = routeSummary
    let changedAmount = 0
    let parsedAmountOutFromBuild: CurrencyAmount<Currency> | undefined = undefined
    let amountOutUsdFromBuild: string | undefined = undefined

    if (buildResult?.data) {
      const { amountOut } = buildResult.data
      parsedAmountOutFromBuild = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)

      amountOutUsdFromBuild = buildResult.data.amountOutUsd

      const { amount } = buildResult.data.outputChange || {}
      changedAmount = Number(amount)
    }

    return (
      <SwapBrief
        $level={changedAmount > 0 ? 'better' : changedAmount < 0 ? 'worse' : undefined}
        inputAmount={parsedAmountIn}
        amountInUsd={amountInUsd}
        outputAmount={parsedAmountOut}
        outputAmountFromBuild={parsedAmountOutFromBuild}
        amountOutUsdFromBuild={amountOutUsdFromBuild}
        currencyOut={routeSummary.parsedAmountOut.currency}
        isLoading={isBuildingRoute}
      />
    )
  }

  const warningStyle =
    priceImpactResult.isVeryHigh || priceImpactResult.isInvalid
      ? { background: theme.red }
      : priceImpactResult.isHigh || isWarningSlippage
      ? { background: theme.warning }
      : undefined

  const disableByPriceImpact = !isAdvancedMode && (priceImpactResult.isVeryHigh || priceImpactResult.isInvalid)
  const disableSwap =
    (outputAmountChange < 0 && !hasAcceptedNewPrice) || shouldDisableConfirmButton || disableByPriceImpact

  return (
    <Wrapper>
      <AutoColumn>
        <RowBetween>
          <Text fontWeight={400} fontSize={20}>
            <Trans>Confirm Swap Details</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        <RowBetween mt="12px">
          <Text fontWeight={400} fontSize={12} color={theme.subText}>
            <Trans>Please review the details of your swap:</Trans>
          </Text>
          {isBuildingRoute && (
            <Flex width="fit-content" height="100%" alignItems="center" sx={{ gap: '4px' }}>
              <Loader size="14px" stroke={theme.primary} />
              <Text as="span" fontSize={12} color={theme.subText}>
                <Dots>
                  <Trans>Checking price</Trans>
                </Dots>
              </Text>
            </Flex>
          )}
        </RowBetween>

        {outputAmountChange < 0 && (
          <PriceUpdateWarning
            $level={priceImpactResult.isVeryHigh ? 'error' : 'warning'}
            isAccepted={hasAcceptedNewPrice}
          >
            {hasAcceptedNewPrice ? (
              <Check size={20} />
            ) : (
              <AlertTriangle
                color={priceImpactResult.isVeryHigh || priceImpactResult.isInvalid ? theme.red : theme.warning}
                size={16}
              />
            )}
            <Text flex={1}>
              {hasAcceptedNewPrice ? (
                <Trans>New Price Accepted</Trans>
              ) : (
                <Trans>Your price has been updated. Please accept the new price before proceeding with the swap</Trans>
              )}
            </Text>
          </PriceUpdateWarning>
        )}

        {renderSwapBrief()}
      </AutoColumn>

      <SwapDetails {...getSwapDetailsProps()} />

      <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
        <SlippageWarningNote rawSlippage={slippage} isStablePairSwap={isStablePairSwap} />

        <PriceImpactNote isDegenMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

        {errorWhileBuildRoute && (
          <WarningNote
            shortText={
              errorWhileBuildRoute.includes('enough') || errorWhileBuildRoute.includes('min') ? (
                <Text>
                  <Trans>
                    There was an issue while confirming your price and minimum amount received. You may consider
                    adjusting your <b>Max Slippage</b> and then trying to swap again.
                  </Trans>
                </Text>
              ) : (
                <Text>
                  <Trans>There was an issue while trying to confirm your price. Please try to swap again.</Trans>
                </Text>
              )
            }
          />
        )}

        {isSolana && !encodeSolana ? (
          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }} id="confirm-swap-or-send">
            <Dots>
              <Trans>Checking accounts</Trans>
            </Dots>
          </GreyCard>
        ) : errorWhileBuildRoute ? (
          <ButtonPrimary onClick={onDismiss}>
            <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
              <Trans>Dismiss</Trans>
            </Text>
          </ButtonPrimary>
        ) : (
          <Flex sx={{ gap: '8px', width: '100%' }}>
            {outputAmountChange < 0 && (
              <ButtonPrimary
                style={
                  hasAcceptedNewPrice
                    ? undefined
                    : {
                        backgroundColor:
                          priceImpactResult.isVeryHigh || priceImpactResult.isInvalid ? theme.red : theme.warning,
                      }
                }
                onClick={() => setHasAcceptedNewPrice(true)}
                disabled={hasAcceptedNewPrice}
              >
                Accept New Price
              </ButtonPrimary>
            )}

            <ButtonPrimary
              onClick={onSwap}
              disabled={disableSwap}
              id="confirm-swap-or-send"
              style={disableSwap ? undefined : warningStyle}
            >
              <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
                <Trans>Confirm Swap</Trans>
              </Text>
            </ButtonPrimary>
          </Flex>
        )}
      </Flex>
    </Wrapper>
  )
}
