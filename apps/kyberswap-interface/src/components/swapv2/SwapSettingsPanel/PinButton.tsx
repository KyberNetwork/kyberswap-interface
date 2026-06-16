import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as PinSolidIcon } from 'assets/svg/pin_solid_icon.svg'
import IconButton from 'components/Button/IconButton'

type Props = {
  isActive: boolean
  onClick: () => void
}
const PinButton: React.FC<Props> = ({ isActive, onClick }) => {
  return (
    <IconButton aria-label={isActive ? 'Unpin setting' : 'Pin setting'} onClick={onClick} size={24}>
      {isActive ? (
        <PinSolidIcon height="16px" className="rotate-45 text-text" />
      ) : (
        <PinIcon height="16px" className="rotate-45 text-subText" />
      )}
    </IconButton>
  )
}

export default PinButton
