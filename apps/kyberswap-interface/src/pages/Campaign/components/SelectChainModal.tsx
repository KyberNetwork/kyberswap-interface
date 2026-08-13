import { Trans } from '@lingui/macro'

import { Content, Header, Icon, OptionButton, Options, Section, Shell } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'

export const SelectChainModal = ({
  showSelect,
  connect,
  setShowSelect,
  logo,
}: {
  showSelect: boolean
  connect: Record<string, () => void>
  setShowSelect: (show: boolean) => void
  logo: Record<string, string>
}) => {
  const closeModal = () => setShowSelect(false)
  const chainOptions = Object.entries(logo)

  return (
    <Modal
      isOpen={showSelect}
      onDismiss={closeModal}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
      width="min(430px, calc(100vw - 32px))"
    >
      <Shell>
        <Section>
          <Header title={<Trans>Select chain</Trans>} onClose={closeModal} />

          <Content>
            <Options>
              {chainOptions.map(([walletType, icon]) => (
                <OptionButton
                  key={walletType}
                  role="button"
                  connected={false}
                  onClick={() => {
                    closeModal()
                    connect[walletType]()
                  }}
                >
                  <Icon>
                    <img src={icon} alt={walletType} />
                  </Icon>
                  <span>{walletType}</span>
                </OptionButton>
              ))}
            </Options>
          </Content>
        </Section>
      </Shell>
    </Modal>
  )
}
