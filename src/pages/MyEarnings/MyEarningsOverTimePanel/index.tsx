import React, { useCallback, useState } from 'react'

import BasePanel from 'pages/MyEarnings/MyEarningsOverTimePanel/BasePanel'
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

  const { isLoading, ticks } = props

  const toggleModal = useCallback(() => {
    setModalOpen(o => !o)
  }, [])

  return (
    <>
      <BasePanel {...props} toggleModal={toggleModal} />
      <ZoomOutModal isOpen={isModalOpen} toggleOpen={toggleModal} isLoading={isLoading} ticks={ticks} />
    </>
  )
}

export default MyEarningsOverTimePanel
