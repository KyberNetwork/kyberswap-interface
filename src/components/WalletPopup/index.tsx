import { useRef } from 'react'
import Draggable from 'react-draggable'
import { useMedia } from 'react-use'

import Modal from 'components/Modal'
import { HANDLE_CLASS_NAME } from 'components/WalletPopup/DragHandle'
import { MEDIA_WIDTHS } from 'theme'

import WalletView from './WalletView'

const WalletPopup = ({
  onDismiss,
  isPinned,
  setPinned,
}: {
  onDismiss: () => void
  isPinned: boolean
  setPinned: (v: boolean) => void
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const handleClosePopup = () => {
    onDismiss()
    setPinned(false)
  }

  const handlePinPopup = () => {
    setPinned(true)
  }

  if (isMobile) {
    return (
      <Modal isOpen={true} onDismiss={onDismiss} minHeight={false} maxHeight={90} maxWidth={410}>
        <WalletView onDismiss={handleClosePopup} isPinned={isPinned} />
      </Modal>
    )
  }

  return (
    <Draggable disabled={!isPinned} defaultPosition={{ x: 0, y: 0 }} nodeRef={nodeRef} handle={`.${HANDLE_CLASS_NAME}`}>
      <div
        style={{
          position: 'fixed',
          zIndex: '98', // TODO: check this
          right: isPinned ? '10px' : 0,
          bottom: isPinned ? '10px' : 0,
          transition: 'right 150ms, bottom 150ms',
        }}
        ref={nodeRef}
      >
        <WalletView onDismiss={handleClosePopup} isPinned={isPinned} onPin={handlePinPopup} />
      </div>
    </Draggable>
  )
}

export default WalletPopup
