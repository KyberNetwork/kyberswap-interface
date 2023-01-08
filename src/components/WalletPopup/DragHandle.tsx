import { Flex } from 'rebass'

import { ReactComponent as DragHandleIcon } from 'assets/svg/wallet_drag_handle.svg'

export const HANDLE_CLASS_NAME = 'walletPopupDragHandle'

const DragHandle = () => {
  return (
    <Flex
      className={HANDLE_CLASS_NAME}
      sx={{
        cursor: 'move',
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <DragHandleIcon />
    </Flex>
  )
}

export default DragHandle
