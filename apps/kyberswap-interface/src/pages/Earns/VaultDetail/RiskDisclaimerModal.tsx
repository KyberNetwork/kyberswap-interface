import { t } from '@lingui/macro'

import Modal from 'components/Modal'
import { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import { ModalHeader, ModalTitle, ModalTitleRow, ModalWrapper } from 'pages/Earns/components/VaultDeposit/styles'

/**
 * What the user is actually signing up for: someone else's strategy, reached through this UI. Kept
 * to the four things that change how the money behaves rather than a wall of legal text.
 */
const RiskDisclaimerModal = ({
  isOpen,
  providerName,
  onDismiss,
}: {
  isOpen: boolean
  providerName: string
  onDismiss: () => void
}) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} width="480px" bgColor="transparent">
    <ModalWrapper>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Before you deposit`}</ModalTitle>
          <CloseButton onClose={onDismiss} />
        </ModalTitleRow>
      </ModalHeader>

      <ul className="m-0 flex list-disc flex-col gap-3 pl-5 text-sm leading-5 text-subText marker:text-gray">
        <li>{t`This vault is managed by ${providerName}. KyberSwap provides the access interface only, and does not run the strategy or hold your funds.`}</li>
        <li>{t`Your deposit is exposed to the vault's smart contracts and to whatever the strategy invests in. Returns are not guaranteed and the balance can fall.`}</li>
        <li>{t`Earnings auto-compound into your balance. There is no reward to claim.`}</li>
        <li>{t`Native withdrawals go through a queue: they start at around 3 days and can take longer depending on the strategy. Exiting sooner means selling on the market at whatever price it offers.`}</li>
      </ul>
    </ModalWrapper>
  </Modal>
)

export default RiskDisclaimerModal
