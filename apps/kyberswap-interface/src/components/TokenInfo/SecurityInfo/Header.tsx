import { ReactNode } from 'react'
import { AlertOctagon } from 'react-feather'

export const BadgeWarning = ({ warning, danger }: { warning: number; danger: number }) => {
  return (
    <div className="flex items-center gap-2.5">
      {danger > 0 && (
        <div className="flex items-center gap-1 text-sm text-red">
          <AlertOctagon size={16} /> {danger}
        </div>
      )}
      {warning > 0 && (
        <div className="flex items-center gap-1 text-sm text-warning">
          <AlertOctagon size={16} /> {warning}
        </div>
      )}
    </div>
  )
}

type HeaderProps = {
  warning: number
  danger: number
  title: string
  icon: ReactNode
}

export const Header = ({ warning, danger, title, icon }: HeaderProps) => {
  return (
    <div className="flex min-h-10 flex-1 items-center justify-between gap-3 py-2 pl-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-medium text-subText">{title}</span>
      </div>
      <BadgeWarning warning={warning} danger={danger} />
    </div>
  )
}
