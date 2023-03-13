import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

import { ENABLE_CLICK_TO_REFRESH_GET_ROUTE, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'

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
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const element = svgRef?.current
    if (!element) {
      return
    }

    if (shouldDisable) {
      intervalRef.current && clearInterval(intervalRef.current)

      // reset svg animate duration to 0 and PAUSE animations
      element.setCurrentTime(0)
      element.pauseAnimations()
    } else {
      // reset svg animate duration to 0 and UNPAUSE animations

      element.setCurrentTime(0)
      element.unpauseAnimations()
      callback()
      intervalRef.current = setInterval(() => {
        callback()
      }, TIME_TO_REFRESH_SWAP_RATE * 1000)
    }

    return () => {
      intervalRef.current && clearInterval(intervalRef.current)
    }
  }, [callback, shouldDisable])

  return (
    <IconButton
      onClick={() => {
        if (!ENABLE_CLICK_TO_REFRESH_GET_ROUTE) {
          return
        }
        callback()
      }}
    >
      <LoadingIcon
        ref={svgRef}
        clickable={ENABLE_CLICK_TO_REFRESH_GET_ROUTE}
        durationInSeconds={TIME_TO_REFRESH_SWAP_RATE}
      />
    </IconButton>
  )
}

export default RefreshButton
