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
  enabled: boolean
  onRefresh: () => void
}

const RefreshButton: React.FC<Props> = ({ enabled, onRefresh }) => {
  const svgLoadingRef = useRef<SVGSVGElement>(null)
  const onRefreshRef = useRef(onRefresh)

  onRefreshRef.current = onRefresh
  useEffect(() => {
    let interval: any
    const element = svgLoadingRef?.current
    if (!element) {
      return
    }

    if (enabled) {
      // reset svg animate duration to 0 and UNPAUSE animations
      element.setCurrentTime(0)
      element.unpauseAnimations()
      interval = setInterval(() => {
        onRefreshRef.current()
      }, TIME_TO_REFRESH_SWAP_RATE * 1000)
    } else {
      clearInterval(interval)
      // reset svg animate duration to 0 and PAUSE animations
      element.setCurrentTime(0)
      element.pauseAnimations()
    }

    return () => {
      clearInterval(interval)
    }
  }, [enabled])

  const enableClickToRefresh = false
  return (
    <IconButton
      onClick={() => {
        if (!enableClickToRefresh) {
          return
        }
        onRefresh()
      }}
    >
      <LoadingIcon ref={svgLoadingRef} clickable={enableClickToRefresh} />
    </IconButton>
  )
}

export default RefreshButton
