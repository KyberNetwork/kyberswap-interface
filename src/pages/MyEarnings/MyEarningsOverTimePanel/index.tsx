import React, { useCallback, useState } from 'react'

import BasePanel from 'pages/MyEarnings/MyEarningsOverTimePanel/BasePanel'
import { TimePeriod } from 'pages/MyEarnings/MyEarningsOverTimePanel/TimePeriodSelect'
import { EarningStatsTick } from 'types/myEarnings'

import ZoomOutModal from './ZoomOutModal'

//TODO: move to common
export const formatPercent = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value) + '%'
}

export type Props = {
  className?: string
  isLoading?: boolean
  ticks?: EarningStatsTick[]
  isContainerSmall?: boolean
}

const MyEarningsOverTimePanel: React.FC<Props> = props => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [period, setPeriod] = useState<TimePeriod>('7D')

  const { isLoading, ticks } = props

  const toggleModal = useCallback(() => {
    setModalOpen(o => !o)
  }, [])

  return (
    <>
      <BasePanel {...props} toggleModal={toggleModal} period={period} setPeriod={setPeriod} />
      <ZoomOutModal
        isOpen={isModalOpen}
        toggleOpen={toggleModal}
        isLoading={isLoading}
        ticks={ticks}
        initialPeriod={period}
      />
    </>
  )
}

export default MyEarningsOverTimePanel
