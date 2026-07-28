import { t } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import { Header, Section, Shell, Terms } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { useIsAcceptedTerm } from 'state/user/hooks'

export default function TermAndPolicy({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock
      bypassFocusLock
      zindex={99999}
    >
      <Shell>
        <Section>
          <Header title={t`Connect your Wallet`} onClose={onClose} />
          <div className="flex flex-col gap-4">
            <Terms checked={isAcceptedTerm} onChange={setIsAcceptedTerm} />
            <div className="flex justify-center">
              <ButtonPrimary width="120px" className="py-2" disabled={!isAcceptedTerm} onClick={onConfirm}>
                {t`Continue`}
              </ButtonPrimary>
            </div>
          </div>
        </Section>
      </Shell>
    </Modal>
  )
}
