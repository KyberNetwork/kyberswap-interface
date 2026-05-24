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
      className="!text-red"
      style={{
        width: 'fit-content',
        whiteSpace: 'nowrap',
        height: '24px',
        padding: 0,
        gap: '4px',
        fontSize: '14px',
        flexWrap: 'nowrap',
      }}
      onClick={onClick}
      disabled={isDisabled}
    >
      <Trash size="16px" /> <Trans>Delete</Trans>
    </ButtonEmpty>
  )
}

export default DeleteSingleAlertButton
