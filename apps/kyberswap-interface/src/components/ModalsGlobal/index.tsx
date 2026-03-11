import ModalConfirm from 'components/ConfirmModal'
import RecapSection from 'components/Recap'
import SwitchToEthereumModal from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'

export default function ModalsGlobal() {
  return (
    <>
      <SwitchToEthereumModal />
      <ModalConfirm />
      <RecapSection />
    </>
  )
}
