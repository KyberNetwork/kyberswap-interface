import { cn } from 'utils/cn'

const ProfileTabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'h-12 cursor-pointer border-0 border-r border-border bg-transparent px-5 text-sm font-semibold text-subText transition-colors hover:bg-primary-10 hover:text-primary',
      active && 'border-b-2 border-b-primary bg-primary-12 text-primary',
    )}
  >
    {children}
  </button>
)

export default ProfileTabButton
