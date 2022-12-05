import styled from 'styled-components'

import Modal from 'components/Modal'
import useGetEarningsOverTime from 'hooks/myEarnings/useGetEarningsOverTime'
import EarningsPanel from 'pages/MyEarnings/MyEarningsOverTimePanel'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleEthPowAckModal } from 'state/application/hooks'

const Panel = styled(EarningsPanel)`
  border: none;
`

const MyEarningsZoomOutModal = () => {
  const isModalOpen = useModalOpen(ApplicationModal.MY_EARNINGS_ZOOM_OUT)
  const toggleOpenThisModal = useToggleEthPowAckModal()
  const earningsOverTimeState = useGetEarningsOverTime()

  return (
    <Modal
      isOpen={isModalOpen}
      onDismiss={toggleOpenThisModal}
      maxWidth="calc(100vw - 32px)"
      width="100%"
      height="100%"
    >
      <Panel isZoomed isLoading={earningsOverTimeState.isValidating} data={earningsOverTimeState.data} />
    </Modal>
  )
}

export default MyEarningsZoomOutModal
