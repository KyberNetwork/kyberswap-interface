import { ReactComponent as PinIcon } from 'assets/svg/ic_pin.svg'
import IconButton from 'components/Button/IconButton'

type Props = {
  isActive: boolean
  onClick: () => void
}
const PinButton: React.FC<Props> = ({ isActive, onClick }) => {
  return (
    <IconButton
      size={16}
      className="p-0"
      aria-label={isActive ? 'Unpin wallet' : 'Pin wallet'}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <PinIcon width="16px" height="16px" className={isActive ? 'text-primary' : 'text-subText'} aria-hidden="true" />
    </IconButton>
  )
}

export default PinButton
