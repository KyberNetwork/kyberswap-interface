import { Currency, Token } from '@kyberswap/ks-sdk-core'

import Modal from 'components/Modal'
import { ImportToken } from 'components/SearchModal/ImportToken'

const noop = () => {
  // empty
}

export default function TokenWarningModal({
  isOpen,
  tokens,
  onConfirm,
}: {
  isOpen: boolean
  tokens: Token[]
  onConfirm: (token: Currency[]) => void
}) {
  return (
    <Modal isOpen={isOpen} onDismiss={noop} maxHeight={100}>
      <ImportToken tokens={tokens} handleCurrencySelect={onConfirm} enterToImport={isOpen} />
    </Modal>
  )
}
