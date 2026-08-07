import { t } from '@lingui/macro'

import Dots from 'components/Dots'
import { cn } from 'utils/cn'

type Props = {
  className?: string
  /** Shortens the label for cells too narrow to fit the full word. */
  compact?: boolean
}

/**
 * Rides on an aggregate that had its EG share left out, flagging the missing part without pushing
 * the figure itself out of the way.
 */
const EgCalculatingMarker = ({ className, compact }: Props) => (
  <sup className={cn('ml-0.5 whitespace-nowrap text-[10px] font-normal text-subText', className)}>
    <Dots>{compact ? t`+EG calc` : t`+EG calculating`}</Dots>
  </sup>
)

export default EgCalculatingMarker
