import { Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonError } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { AutoRow, RowBetween } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import AcceptChangesNotice from 'components/SwapForm/SwapModal/AcceptChangesNotice'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useEncodeSolana } from 'state/swap/hooks'
import { CloseIcon } from 'theme/components'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { calculatePriceImpact } from 'utils/getMetaAggregatorRoutes/utils'
import { checkPriceImpact } from 'utils/prices'

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

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
  onRetry: () => void
}

const ConfirmSwapModalContent: React.FC<Props> = ({
  buildResult,
  isBuildingRoute,
  errorWhileBuildRoute,
  onDismiss,
  onSwap,
  onRetry,
}) => {
  const theme = useTheme()
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const [isAcceptedChanges, setAcceptedChanges] = useState(false)
  const { routeSummary } = useSwapFormContext()

  const shouldShowAcceptChanges =
    !isBuildingRoute && !errorWhileBuildRoute && !isAcceptedChanges && buildResult?.data?.outputChange?.level === 0

  const priceImpactCheck = checkPriceImpact(routeSummary?.priceImpact)

  const handleAcceptChanges = () => {
    setAcceptedChanges(true)
  }

  const getSwapDetailsProps = (): SwapDetailsProps => {
    if (!buildResult?.data || !routeSummary || !isAcceptedChanges) {
      return {
        acceptedChanges: undefined,
      }
    }

    const { amountIn, amountInUsd, amountOut, amountOutUsd, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const priceImpact = calculatePriceImpact(Number(amountInUsd), Number(amountOutUsd))
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )

    return {
      acceptedChanges: {
        gasUsd,
        priceImpact,
        executionPrice,
        parsedAmountOut,
        amountInUsd,
      },
    }
  }

  useEffect(() => {
    setAcceptedChanges(false)
  }, [buildResult])

  return (
    <Wrapper>
      <AutoColumn>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Confirm Swap</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {!!(routeSummary && routeSummary.parsedAmountIn && routeSummary.parsedAmountOut) && (
          <SwapBrief inputAmount={routeSummary.parsedAmountIn} outputAmount={routeSummary.parsedAmountOut} />
        )}
      </AutoColumn>

      {shouldShowAcceptChanges && <AcceptChangesNotice level={2} onAcceptChange={handleAcceptChanges} />}

      {!isBuildingRoute && errorWhileBuildRoute ? (
        <Flex
          sx={{
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Text>{errorWhileBuildRoute}</Text>
          <ButtonEmpty onClick={onRetry}>Try again</ButtonEmpty>
        </Flex>
      ) : (
        <AutoColumn gap="0">
          {isBuildingRoute ? (
            <Flex
              sx={{
                height: '160px',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Loader size="48px" stroke={theme.primary} strokeWidth="1" />
            </Flex>
          ) : (
            <SwapDetails {...getSwapDetailsProps()} />
          )}
        </AutoColumn>
      )}

      <AutoRow>
        {isSolana && !encodeSolana ? (
          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }} id="confirm-swap-or-send">
            <Dots>
              <Trans>Checking accounts</Trans>
            </Dots>
          </GreyCard>
        ) : (
          <ButtonError
            onClick={onSwap}
            disabled={isBuildingRoute || !!errorWhileBuildRoute || shouldShowAcceptChanges}
            style={
              priceImpactCheck.isHigh
                ? {
                    border: 'none',
                    background: priceImpactCheck.isVeryHigh ? theme.red : theme.warning,
                    color: theme.text,
                  }
                : undefined
            }
            id="confirm-swap-or-send"
          >
            <Text fontSize={16} fontWeight={500}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonError>
        )}
      </AutoRow>
    </Wrapper>
  )
}

export default ConfirmSwapModalContent
