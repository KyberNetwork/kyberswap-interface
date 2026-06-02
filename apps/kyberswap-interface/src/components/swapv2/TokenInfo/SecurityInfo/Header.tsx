import { ReactNode } from 'react'
import { AlertOctagon } from 'react-feather'

const BadgeWarning = ({ warning, danger }: { warning: number; danger: number }) => {
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

const Header = ({
  warning,
  danger,
  title,
  icon,
}: {
  warning: number
  danger: number
  title: string
  icon: ReactNode
}) => {
  return (
    <div className="flex flex-1 justify-between py-3 pl-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-normal text-subText">{title}</span>
      </div>
      <BadgeWarning warning={warning} danger={danger} />
    </div>
  )
}

export default Header
