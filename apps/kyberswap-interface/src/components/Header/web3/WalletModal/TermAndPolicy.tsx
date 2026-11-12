import { t } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import { Terms, WalletModalShell } from 'components/Header/web3/WalletModal/components'
import { useIsAcceptedTerm } from 'state/user/hooks'

const TermAndPolicy = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) => {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  return (
    <WalletModalShell isOpen={isOpen} onDismiss={onClose}>
      <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
      <div className="flex justify-center">
        <ButtonPrimary width="120px" className="py-2" disabled={!isAcceptedTerm} onClick={onConfirm}>
          {t`Continue`}
        </ButtonPrimary>
      </div>
    </WalletModalShell>
  )
}

export default TermAndPolicy
