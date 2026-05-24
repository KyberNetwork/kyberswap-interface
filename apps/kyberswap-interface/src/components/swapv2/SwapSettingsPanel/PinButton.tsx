import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as PinSolidIcon } from 'assets/svg/pin_solid_icon.svg'

type Props = {
  isActive: boolean
  onClick: () => void
}
const PinButton: React.FC<Props> = ({ isActive, onClick }) => {
  return (
    <div className="ml-2 flex size-4 cursor-pointer items-center justify-center" role="button" onClick={onClick}>
      {isActive ? (
        <PinSolidIcon height="16px" className="text-text" />
      ) : (
        <PinIcon height="16px" className="text-subText" />
      )}
    </div>
  )
}

export default PinButton
