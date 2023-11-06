import ModalConfirm from 'components/ConfirmModal'
import SwitchToEthereumModal from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'

export default function ModalsGlobal() {
  return (
    <>
      <SwitchToEthereumModal />
      <ModalConfirm />
    </>
  )
}
