import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { NotificationType } from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import WarningIcon from 'components/Icons/WarningIcon'
import { AutoRow } from 'components/Row'
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
    [NotificationType.WARNING]: <WarningIcon solid color={color} />,
    [NotificationType.ERROR]: <IconFailure color={color} />,
  }

  const navigate = useNavigate()
  const onClickLink = () => {
    link && navigate(link)
    onRemove?.()
  }
  return (
    <AutoRow className="flex-nowrap">
      <div className="pr-2.5">{icon || mapIcon[type]}</div>
      <AutoColumn className="gap-2">
        <span className={cn('text-base font-medium', colorClass)}>{title}</span>
        {summary && <span className="text-sm font-normal text-text">{summary}</span>}
        {link && (
          <span className={cn('cursor-pointer text-sm font-medium', colorClass)} onClick={onClickLink}>
            <Trans>See here</Trans>
          </span>
        )}
      </AutoColumn>
    </AutoRow>
  )
}
