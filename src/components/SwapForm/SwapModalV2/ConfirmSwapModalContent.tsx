import { Trans } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { CloseIcon } from 'theme/components'

import useBuildRoute, { BuildRouteResult } from '../useBuildRoute'
import SwapBrief from './SwapBrief'
import SwapDetails from './SwapDetails'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  padding-top: 0;
  padding-bottom: 28px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

type Props = {
  swapErrorMessage: string | undefined
  onDismiss: () => void
}

const ConfirmSwapModalContent: React.FC<Props> = ({ swapErrorMessage, onDismiss }) => {
  const [isLoading, setLoading] = useState(false)
  const [buildResult, setBuildResult] = useState<BuildRouteResult>()
  const theme = useTheme()
  const fetcher = useBuildRoute()
  const loadingRef = useRef(isLoading)
  loadingRef.current = isLoading
  const handleBuildRoute = async () => {
    if (loadingRef.current) {
      return
    }

    setLoading(true)
    setBuildResult(undefined)
    const result = await fetcher()
    setBuildResult(result)
    setLoading(false)
    console.log('setLoading(false)')
  }

  const priceImpact = useSelector((state: AppState) => state.swap.routeSummary?.priceImpact)
  const routerAddress = useSelector((state: AppState) => state.swap.routerAddress)
  const inputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountIn)
  const outputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountOut)

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallbackV3(
    inputAmount,
    outputAmount,
    priceImpact,
    routerAddress,
    buildResult?.response?.data || '',
  )

  const handleSwap = async () => {
    if (!swapCallback) {
      return
    }

    const hash = await swapCallback()
    console.log({ hash })
  }

  useEffect(() => {
    console.log('useEffect handleBuildRoute')
    handleBuildRoute()
    // fetch one-time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TODO: implement retry button when building failed

  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Confirm Swap</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {!!(inputAmount && outputAmount) && <SwapBrief inputAmount={inputAmount} outputAmount={outputAmount} />}
      </Section>

      {/* TODO: if error, show error & retry */}
      <Text>{buildResult?.error || ''}</Text>

      <BottomSection gap="0">
        {isLoading ? (
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
          <SwapDetails
            onConfirm={handleSwap}
            disabledConfirm={false}
            swapErrorMessage={swapErrorMessage}
            startedTime={undefined}
          />
        )}
      </BottomSection>
    </Wrapper>
  )
}

export default ConfirmSwapModalContent
