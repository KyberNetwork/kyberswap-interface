import { useState } from 'react'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'

export const PageWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full max-w-[1464px] flex-col items-stretch gap-6 px-9 pt-6 max-lg:h-auto max-sm:gap-4 max-sm:px-4 max-sm:py-5',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex w-full max-w-[1392px] items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6 max-sm:gap-4',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative z-[1] bg-background', className)} {...rest}>
    {children}
  </div>
)

interface StyledBalanceMaxMiniProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hover?: boolean
}

export const StyledBalanceMaxMini = ({ hover, className, children, ...rest }: StyledBalanceMaxMiniProps) => (
  <button
    className={cn(
      'float-right flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.2rem] text-sm font-normal text-text2',
      hover && 'hover:bg-bg3 focus:bg-bg3 focus:outline-none',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

export function SwapCallbackError({ error, style = {} }: { error: string; style?: React.CSSProperties }) {
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <div
      className="z-[-1] mt-9 flex w-full items-center rounded-2xl bg-buttonBlack-40 py-2 pl-2 pr-5 text-[0.825rem]"
      style={style}
    >
      <Alert className="mb-auto" />
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

export const SwapFormWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'z-[1] flex w-[425px] flex-shrink-0 flex-col items-center justify-center gap-4 max-sm:w-full lg:sticky lg:top-4',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const InfoComponentsWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-[calc(100%-472px)] flex-grow flex-col gap-5 max-md:w-full', className)} {...rest}>
    {children}
  </div>
)

interface StyledActionButtonSwapFormProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  hoverBg?: string
}

export const StyledActionButtonSwapForm = ({
  active,
  hoverBg,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: StyledActionButtonSwapFormProps) => {
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg
    onMouseEnter?.(e)
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hoverBg) e.currentTarget.style.backgroundColor = ''
    onMouseLeave?.(e)
  }
  return (
    <button
      className={cn(
        'relative m-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-none p-0 outline-none',
        active ? 'bg-buttonGray' : 'bg-transparent',
        !hoverBg && 'hover:bg-background',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </button>
  )
}
