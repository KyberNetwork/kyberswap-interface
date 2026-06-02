import { Placement } from '@popperjs/core'
import { useCallback, useState } from 'react'
import { Info } from 'react-feather'

import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export default function QuestionHelper({
  text,
  color,
  size = 12,
  useCurrentColor,
  placement,
}: {
  text: string
  color?: string
  size?: number
  useCurrentColor?: boolean
  placement?: Placement
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  const theme = useTheme()

  return (
    <span className="ml-1 inline-flex items-center">
      <Tooltip placement={placement} text={text} show={show}>
        <div
          onClick={open}
          onMouseEnter={open}
          onMouseLeave={close}
          className={cn(
            'flex cursor-default items-center justify-center rounded-[36px] border-none bg-transparent outline-none hover:opacity-70 focus:opacity-70',
            useCurrentColor ? 'text-inherit' : 'text-text2',
          )}
        >
          <Info size={size} color={useCurrentColor ? undefined : color || theme.subText} />
        </div>
      </Tooltip>
    </span>
  )
}
