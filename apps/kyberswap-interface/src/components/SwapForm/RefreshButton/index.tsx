import React, { useEffect, useRef } from 'react'

import { ENABLE_CLICK_TO_REFRESH_GET_ROUTE, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'

import LoadingIcon from './LoadingIcon'

type Props = {
  shouldDisable: boolean
  callback: () => void
  size?: number
  skipFirst?: boolean
}
const RefreshButton: React.FC<Props> = ({ shouldDisable, callback, size, skipFirst }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let interval: any
    const element = svgRef?.current
    if (!element) {
      return
    }

    if (shouldDisable) {
      // reset svg animate duration to 0 and PAUSE animations
      element.setCurrentTime(0)
      element.pauseAnimations()
    } else {
      // reset svg animate duration to 0 and UNPAUSE animations

      element.setCurrentTime(0)
      element.unpauseAnimations()
      if (!skipFirst) callback()
      interval = setInterval(() => {
        callback()
      }, TIME_TO_REFRESH_SWAP_RATE * 1000)
    }

    return () => {
      clearInterval(interval)
    }
  }, [callback, shouldDisable, skipFirst])

  return (
    <button
      onClick={() => {
        if (!ENABLE_CLICK_TO_REFRESH_GET_ROUTE) {
          return
        }
        callback()
      }}
      className="relative m-0 flex size-4 cursor-default items-center justify-center rounded-full border-none bg-transparent p-0 outline-none hover:cursor-default hover:outline-none"
    >
      <LoadingIcon
        size={size}
        ref={svgRef}
        clickable={ENABLE_CLICK_TO_REFRESH_GET_ROUTE}
        durationInSeconds={TIME_TO_REFRESH_SWAP_RATE}
      />
    </button>
  )
}

export default RefreshButton
