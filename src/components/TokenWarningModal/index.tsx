import React from 'react'

import { Token } from '@kyberswap/ks-sdk-core'
import Modal from '../Modal'
import { ImportToken } from 'components/SearchModal/ImportToken'

export default function TokenWarningModal({
  isOpen,
  text,
  tokens,
  onConfirm,
  onDismiss,
}: {
  text?: string
  isOpen: boolean
  tokens: Token[]
  onConfirm: () => void
  onDismiss: () => void
}) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={100}>
      <ImportToken text={text} tokens={tokens} handleCurrencySelect={onConfirm} />
    </Modal>
  )
}
