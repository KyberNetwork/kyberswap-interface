import React from 'react'
import Modal from 'components/Modal'
import Chart from 'pages/TrueSight/components/Chart'
import { TrendingSoonChartData } from 'pages/TrueSight/hooks/useGetTrendingSoonChartData'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight/index'

const MobileChartModal = ({
  isOpen,
  setIsOpen,
  chartData,
  chartCategory,
  setChartCategory,
  chartTimeframe,
  setChartTimeframe
}: {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  chartData: TrendingSoonChartData
  chartCategory: TrueSightChartCategory
  setChartCategory: React.Dispatch<React.SetStateAction<TrueSightChartCategory>>
  chartTimeframe: TrueSightTimeframe
  setChartTimeframe: React.Dispatch<React.SetStateAction<TrueSightTimeframe>>
}) => {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} minHeight={50} maxWidth={9999}>
      <Chart
        chartData={chartData}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </Modal>
  )
}

export default MobileChartModal
