import { useEffect, useState } from 'react'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { TimePeriod } from 'pages/MyEarnings/MyEarningsOverTimePanel/TimePeriodSelect'
import { EarningStatsTick } from 'types/myEarnings'

import BasePanel from './BasePanel'

const Panel = styled(BasePanel)`
  border: none;
`

type Props = {
  isOpen: boolean
  toggleOpen: () => void
  isLoading: boolean | undefined
  ticks: EarningStatsTick[] | undefined
  initialPeriod: TimePeriod
}
const ZoomOutModal: React.FC<Props> = ({ ticks, isLoading, isOpen, toggleOpen, initialPeriod }) => {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod)

  useEffect(() => {
    setPeriod(initialPeriod)
  }, [initialPeriod])

  return (
    <Modal isOpen={isOpen} onDismiss={toggleOpen} maxWidth="1200px" width="100%" height="800px">
      <Panel
        isZoomed
        isLoading={isLoading}
        ticks={ticks}
        toggleModal={toggleOpen}
        period={period}
        setPeriod={setPeriod}
      />
    </Modal>
  )
}

export default ZoomOutModal
