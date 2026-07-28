import { Trans } from '@lingui/macro'
import { Trash } from 'react-feather'

import { ButtonEmpty } from 'components/Button'

type Props = {
  isDisabled: boolean
  onClick: () => void
}
const DeleteSingleAlertButton: React.FC<Props> = ({ isDisabled, onClick }) => {
  return (
    <ButtonEmpty
      className="h-6 w-fit flex-nowrap gap-1 whitespace-nowrap p-0 text-sm !text-red"
      onClick={onClick}
      disabled={isDisabled}
    >
      <Trash size="16px" /> <Trans>Delete</Trans>
    </ButtonEmpty>
  )
}

export default DeleteSingleAlertButton
