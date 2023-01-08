import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Draggable from 'react-draggable'
import { useMedia } from 'react-use'

import Modal from 'components/Modal'
import { HANDLE_CLASS_NAME } from 'components/WalletPopup/DragHandle'
import { useActiveWeb3React } from 'hooks'
import { MEDIA_WIDTHS } from 'theme'

import WalletView from './WalletView'

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const root = document.getElementById('app')
  if (!root) {
    return null
  }

  return createPortal(children, root)
}

const WalletPopup = () => {
  const [isOpen, setOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [isPinned, setPinned] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)
  const { account } = useActiveWeb3React()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  if (isMobile || !account) {
    return null
  }

  const handleOpenPopup = () => {
    setOpen(true)
    setShowOverlay(true)
    setPinned(false)
  }

  const handleClosePopup = () => {
    setOpen(false)
    setShowOverlay(false)
    setPinned(false)
  }

  const handlePinPopup = () => {
    setShowOverlay(false)
    setPinned(true)
  }

  return (
    <>
      {/* TODO: remove this and bind to wallet button instead */}
      {!isOpen && (
        <Portal>
          <button
            style={{
              position: 'fixed',
              right: 30,
              bottom: 130,
              zIndex: 10,
            }}
            onClick={handleOpenPopup}
          >
            wallet ui
          </button>
        </Portal>
      )}

      {/* render a modal separately instead of placing the popup inside, 
      so that when popup is pinned, glitch won't happen */}
      <Modal isOpen={showOverlay} onDismiss={handleClosePopup} zindex={80} />

      {isOpen && (
        <Draggable
          disabled={!isPinned}
          defaultPosition={{ x: 0, y: 0 }}
          nodeRef={nodeRef}
          handle={`.${HANDLE_CLASS_NAME}`}
        >
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
      )}
    </>
  )
}

export default WalletPopup
