import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { AppState } from 'state'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'

import useMetaAggregatorRouteFetcher from '../useMetaAggregatorRouteFetcher'
import LoadingIcon from './LoadingIcon'

const IconButton = styled.button`
  position: relative;
  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  border-radius: 999px;
  cursor: default;
  outline: none;

  :hover {
    cursor: default;
    outline: none;
  }
`

const RefreshButton: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const fetcher = useMetaAggregatorRouteFetcher()

  // disable when previewing or input amount is not yet entered
  const parsedAmount = useParsedAmountFromInputCurrency()
  const isConfirming = useSelector((state: AppState) => state.swap.isConfirming)
  const shouldDisable = !parsedAmount || parsedAmount.equalTo(0) || isConfirming

  useEffect(() => {
    let interval: any
    const element = svgRef?.current
    if (!element) {
      return
    }

    if (shouldDisable) {
      // reset svg animate duration to 0 and PAUSE animations
      clearInterval(interval)
      element.setCurrentTime(0)
      element.pauseAnimations()
    } else {
      // reset svg animate duration to 0 and UNPAUSE animations

      element.setCurrentTime(0)
      element.unpauseAnimations()
      fetcher()
      interval = setInterval(() => {
        fetcher()
      }, TIME_TO_REFRESH_SWAP_RATE * 1000)
    }

    return () => {
      clearInterval(interval)
    }
  }, [fetcher, shouldDisable])

  const enableClickToRefresh = false
  return (
    <IconButton
      onClick={() => {
        if (!enableClickToRefresh) {
          return
        }
        fetcher()
      }}
    >
      <LoadingIcon ref={svgRef} clickable={enableClickToRefresh} durationInSeconds={TIME_TO_REFRESH_SWAP_RATE} />
    </IconButton>
  )
}

export default RefreshButton
