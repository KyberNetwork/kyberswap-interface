import { Trans } from '@lingui/macro'
import { Trash } from 'react-feather'
import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'

type Props = {
  isDisabled: boolean
  onClick: () => void
}
const DeleteSingleAlertButton: React.FC<Props> = ({ isDisabled, onClick }) => {
  const theme = useTheme()
  return (
    <Flex
      style={{
        alignItems: 'center',
        color: theme.red,
        gap: '4px',
        fontSize: '14px',
        cursor: 'pointer',
      }}
      onClick={onClick}
      disabled={isDisabled}
    >
      <Trash size="16px" /> <Trans>Delete</Trans>
    </Flex>
  )
}

export default DeleteSingleAlertButton
