import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import Actions from 'pages/Earns/components/SmartExit/Actions'
import Confirmation from 'pages/Earns/components/SmartExit/Confirmation'
import ExpireSetting from 'pages/Earns/components/SmartExit/ExpireSetting'
import GasSetting from 'pages/Earns/components/SmartExit/GasSetting'
import { GuidedHighlightProvider } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import Metrics from 'pages/Earns/components/SmartExit/Metrics'
import PoolPrice from 'pages/Earns/components/SmartExit/PoolPrice'
import PositionLiquidity from 'pages/Earns/components/SmartExit/PositionLiquidity'
import Warning from 'pages/Earns/components/SmartExit/Warning'
import { FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { useSmartExitDeadline } from 'pages/Earns/components/SmartExit/hooks/useSmartExitDeadline'
import { useSmartExitFeeEstimation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitFeeEstimation'
import { useSmartExitValidation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitValidation'
import { ContentWrapper } from 'pages/Earns/components/SmartExit/styles'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { defaultFeeYieldCondition } from 'pages/Earns/components/SmartExit/utils'
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'

interface SmartExitProps {
  position: ParsedPosition | null
  onDismiss: () => void
  isLoading?: boolean
}

export const SmartExit = ({ position, onDismiss, isLoading = false }: SmartExitProps) => {
  const theme = useTheme()
  const [selectedMetrics, setSelectedMetrics] = useState<Array<SelectedMetric | null>>([
    { metric: Metric.FeeYield, condition: defaultFeeYieldCondition },
  ])
  const [conditionType, setConditionType] = useState<ConditionType>(ConditionType.And)
  const [expireTime, setExpireTime] = useState(FOREVER_EXPIRE_TIME)
  const [showConfirm, setShowConfirm] = useState(false)

  const [multiplier, setMultiplier] = useState<number>(2)
  const [customGasPercent, setCustomGasPercent] = useState<string>('')

  const deadline = useSmartExitDeadline(expireTime)
  const { isValid, deadlineBeforeConditionTime, timeBeforeNow } = useSmartExitValidation(selectedMetrics, deadline)

  const smartExit = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
  })

  const { feeInfo, feeLoading } = useSmartExitFeeEstimation({
    isValid,
    estimateFee: smartExit.estimateFee,
  })

  // Position is loading or not available yet
  const positionLoading = isLoading || !position

  // Calculate max gas percentage
  const maxGasPercent = customGasPercent ? parseFloat(customGasPercent) : (feeInfo?.gas.percentage || 0) * multiplier
  const isGasTooHigh = maxGasPercent >= 100

  const disabled = positionLoading || !isValid || !feeInfo || feeLoading || isGasTooHigh

  return (
    <Modal
      isOpen
      mobileFullWidth
      onDismiss={onDismiss}
      width="100vw"
      maxWidth={showConfirm ? 450 : 800}
      bgColor={theme.background}
      padding="20px"
    >
      <Flex width="100%" flexDirection="column">
        {showConfirm && position ? (
          <Confirmation
            selectedMetrics={selectedMetrics.filter(metric => metric !== null) as SelectedMetric[]}
            conditionType={conditionType}
            deadline={deadline}
            position={position}
            onDismiss={() => setShowConfirm(false)}
            onCloseSmartExit={onDismiss}
            feeSettings={{
              protocolFee: feeInfo?.protocol.percentage || 0,
              maxGas: customGasPercent ? parseFloat(customGasPercent) : (feeInfo?.gas.percentage || 0) * multiplier,
            }}
            createSmartExitOrder={smartExit.createSmartExitOrder}
            isCreating={smartExit.isCreating}
            isSuccess={smartExit.isSuccess}
          />
        ) : (
          <GuidedHighlightProvider selectedMetrics={selectedMetrics}>
            <Flex justifyContent="space-between" alignItems="center" mb="16px">
              <Text fontSize={20} fontWeight={500}>
                <Trans>Set Up Smart Exit</Trans>
              </Text>
              <X onClick={onDismiss} style={{ cursor: 'pointer' }} />
            </Flex>

            <Flex justifyContent="space-between" alignItems="center">
              <PositionDetailHeader
                style={{ flexDirection: 'row' }}
                position={position}
                showBackIcon={false}
                isLoading={positionLoading}
                initialLoading={positionLoading}
                useFromSmartExit
              />
              <ExpireSetting expireTime={expireTime} setExpireTime={setExpireTime} />
            </Flex>

            <ContentWrapper>
              <Flex flexDirection="column" sx={{ gap: '1rem' }} flex={1}>
                <PositionLiquidity position={position} isLoading={positionLoading} />
                <PoolPrice position={position} isLoading={positionLoading} />
              </Flex>

              <Flex flexDirection="column" flex={1} sx={{ gap: '1rem' }}>
                <Metrics
                  position={position}
                  selectedMetrics={selectedMetrics}
                  setSelectedMetrics={setSelectedMetrics}
                  conditionType={conditionType}
                  setConditionType={setConditionType}
                  isLoading={positionLoading}
                />
                <GasSetting
                  feeInfo={feeInfo}
                  multiplier={multiplier}
                  setMultiplier={setMultiplier}
                  customGasPercent={customGasPercent}
                  setCustomGasPercent={setCustomGasPercent}
                  isLoading={positionLoading}
                />
                <Warning
                  deadlineBeforeConditionTime={deadlineBeforeConditionTime}
                  timeBeforeNow={timeBeforeNow}
                  isGasTooHigh={isGasTooHigh}
                />
              </Flex>
            </ContentWrapper>

            <Actions
              onDismiss={onDismiss}
              onPreview={() => !disabled && setShowConfirm(true)}
              disabled={disabled}
              feeLoading={feeLoading}
              positionLoading={positionLoading}
            />
          </GuidedHighlightProvider>
        )}
      </Flex>
    </Modal>
  )
}
