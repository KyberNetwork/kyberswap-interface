import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as PinSolidIcon } from 'assets/svg/pin_solid_icon.svg'

type Props = {
  isActive: boolean
  onClick: () => void
}
const PinButton: React.FC<Props> = ({ isActive, onClick }) => {
  return (
    <div className="flex size-4 cursor-pointer items-center justify-center" role="button" onClick={onClick}>
      {isActive ? <PinSolidIcon className="text-text" /> : <PinIcon className="text-subText" />}
    </div>
  )
}

export default PinButton
