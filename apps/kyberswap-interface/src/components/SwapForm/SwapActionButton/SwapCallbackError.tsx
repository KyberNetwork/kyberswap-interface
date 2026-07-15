import { useState } from 'react'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import { friendlyError } from 'utils/errorMessage'

type SwapCallbackErrorProps = {
  error: string
  style?: React.CSSProperties
}

export const SwapCallbackError = ({ error, style = {} }: SwapCallbackErrorProps) => {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div
      className="z-[-1] mt-9 flex w-full items-center rounded-2xl bg-buttonBlack-40 py-2 pl-2 pr-5 text-[0.825rem]"
      style={style}
    >
      <Alert className="mb-auto size-10 shrink-0" />
      <div className="my-[10px] ml-2 mr-0 flex basis-full flex-col">
        <span className="text-base font-medium leading-6 text-red">{friendlyError(error)}</span>
        {error !== friendlyError(error) && (
          <span className="cursor-pointer text-xs text-primary" onClick={() => setShowDetail(!showDetail)}>
            Show more details
          </span>
        )}
        {showDetail && (
          <span className="my-[10px] mb-1 break-words text-[10px] leading-4 text-text">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </span>
        )}
      </div>
    </div>
  )
}
