import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'

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
type Props = {
  shouldDisable: boolean
  callback: () => void
}
const RefreshButton: React.FC<Props> = ({ shouldDisable, callback }) => {
  const svgRef = useRef<SVGSVGElement>(null)

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
      callback()
      interval = setInterval(() => {
        callback()
      }, TIME_TO_REFRESH_SWAP_RATE * 1000)
    }

    return () => {
      clearInterval(interval)
    }
  }, [callback, shouldDisable])

  const enableClickToRefresh = false
  return (
    <IconButton
      onClick={() => {
        if (!enableClickToRefresh) {
          return
        }
        callback()
      }}
    >
      <LoadingIcon ref={svgRef} clickable={enableClickToRefresh} durationInSeconds={TIME_TO_REFRESH_SWAP_RATE} />
    </IconButton>
  )
}

export default RefreshButton
