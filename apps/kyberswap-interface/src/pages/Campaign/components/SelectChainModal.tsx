import { Trans } from '@lingui/macro'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { CloseIcon } from 'components/Header/web3/WalletModal'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'

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
  return (
    <Modal
      isOpen={showSelect}
      onDismiss={() => setShowSelect(false)}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
      width="240px"
    >
      <div className="flex w-full flex-col p-6">
        <RowBetween gap="20px" mb="24px">
          <span className="text-xl font-medium">
            <Trans>Select chain</Trans>
          </span>
          <CloseIcon
            onClick={() => {
              setShowSelect(false)
            }}
          >
            <Close />
          </CloseIcon>
        </RowBetween>

        {Object.keys(logo).map(walletType => (
          <div
            key={walletType}
            role="button"
            onClick={() => {
              setShowSelect(false)
              connect[walletType]()
            }}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] p-3.5 font-medium hover:bg-buttonBlack"
          >
            <img src={logo[walletType]} width={20} height={20} alt="" style={{ borderRadius: '50%' }} />
            <span>{walletType}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
