import React from 'react'
import Modal from 'components/Modal'
import Chart from 'pages/TrueSight/components/Chart'

const MobileChartModal = ({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} minHeight={50} maxWidth={9999}>
      <Chart />
    </Modal>
  )
}

export default MobileChartModal
