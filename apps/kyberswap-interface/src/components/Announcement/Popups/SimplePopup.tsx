import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import WarningIcon from 'components/Icons/WarningIcon'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export type SimplePopupProps = {
  title: string
  type: NotificationType
  summary?: ReactNode
  icon?: ReactNode
  link?: string
}

export default function SimplePopup({
  title,
  summary,
  type = NotificationType.ERROR,
  icon,
  link,
  onRemove,
}: SimplePopupProps & {
  onRemove?: () => void
}) {
  const theme = useTheme()
  const mapColor = {
    [NotificationType.SUCCESS]: theme.primary,
    [NotificationType.WARNING]: theme.warning,
    [NotificationType.ERROR]: theme.red,
  }
  const color = mapColor[type]
  const colorClass =
    type === NotificationType.SUCCESS ? 'text-primary' : type === NotificationType.WARNING ? 'text-warning' : 'text-red'
  const mapIcon = {
    [NotificationType.SUCCESS]: <CheckCircle color={color} size={'20px'} />,
    [NotificationType.WARNING]: <WarningIcon solid color={color} size={20} />,
    [NotificationType.ERROR]: <IconFailure color={color} size={20} />,
  }

  const navigate = useNavigate()
  const onClickLink = () => {
    link && navigate(link)
    onRemove?.()
  }
  return (
    <div className="grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-x-4 gap-y-1">
      <div className="pt-0.5">{icon || mapIcon[type]}</div>
      <AutoColumn className="min-w-0 gap-1">
        <span className={cn('text-base font-medium', colorClass)}>{title}</span>
        {summary && <span className="text-sm font-normal text-text">{summary}</span>}
        {link && (
          <span className={cn('cursor-pointer text-sm font-medium', colorClass)} onClick={onClickLink}>
            <Trans>See here</Trans>
          </span>
        )}
      </AutoColumn>
    </div>
  )
}
