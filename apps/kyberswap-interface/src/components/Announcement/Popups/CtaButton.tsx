import { t } from '@lingui/macro'
import { MouseEventHandler } from 'react'

import { AnnouncementCTA } from 'components/Announcement/type'
import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { cn } from 'utils/cn'

function CtaButton({
  data,
  className = '',
  color,
  onClick,
}: {
  data: AnnouncementCTA
  className?: string
  color: 'primary' | 'gray' | 'outline' | 'link'
  onClick?: MouseEventHandler<HTMLButtonElement>
}) {
  if (!data) return null
  const { name } = data
  const props = { className, onClick }
  const displayName = name || t`Close`
  switch (color) {
    case 'primary':
      return <ButtonPrimary {...props}>{displayName}</ButtonPrimary>
    case 'outline':
      return <ButtonOutlined {...props}>{displayName}</ButtonOutlined>
    case 'link':
      return (
        <span
          {...props}
          className={`cursor-pointer font-medium text-primary ${className}`}
          onClick={onClick as React.MouseEventHandler<HTMLSpanElement> | undefined}
        >
          {displayName}
        </span>
      )
    default:
      return (
        <ButtonEmpty {...props} className={cn('bg-border text-text', className)}>
          {displayName}
        </ButtonEmpty>
      )
  }
}
export default CtaButton
