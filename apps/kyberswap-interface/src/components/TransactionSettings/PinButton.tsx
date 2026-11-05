import { ReactComponent as PinIcon } from 'assets/svg/ic_pin.svg'
import IconButton from 'components/Button/IconButton'

type Props = {
  isActive: boolean
  onClick: () => void
}

export const PinButton = ({ isActive, onClick }: Props) => {
  return (
    <IconButton
      aria-label={isActive ? 'Unpin setting' : 'Pin setting'}
      aria-pressed={isActive}
      onClick={onClick}
      size={24}
    >
      <PinIcon width="16px" height="16px" className={isActive ? 'text-primary' : 'text-subText'} aria-hidden="true" />
    </IconButton>
  )
}
