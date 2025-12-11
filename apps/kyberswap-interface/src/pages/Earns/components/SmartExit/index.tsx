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
import Metrics from 'pages/Earns/components/SmartExit/Metrics'
import PoolPrice from 'pages/Earns/components/SmartExit/PoolPrice'
import PositionLiquidity from 'pages/Earns/components/SmartExit/PositionLiquidity'
import { FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { useSmartExitDeadline } from 'pages/Earns/components/SmartExit/hooks/useSmartExitDeadline'
import { useSmartExitFeeEstimation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitFeeEstimation'
import { useSmartExitValidation } from 'pages/Earns/components/SmartExit/hooks/useSmartExitValidation'
import { ContentWrapper } from 'pages/Earns/components/SmartExit/styles'
import { defaultFeeYieldCondition } from 'pages/Earns/components/SmartExit/utils'
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'

export const SmartExit = ({ position, onDismiss }: { position: ParsedPosition; onDismiss: () => void }) => {
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
  const { isValid } = useSmartExitValidation(selectedMetrics)

  const { feeInfo, feeLoading } = useSmartExitFeeEstimation({
    position,
    selectedMetrics,
    conditionType,
    deadline,
    isValid,
  })

  const disabled = !isValid || !feeInfo || feeLoading

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
        {showConfirm ? (
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
          />
        ) : (
          <>
            <Flex justifyContent="space-between" alignItems="center" mb="16px">
              <Text fontSize={20} fontWeight={500}>
                <Trans>Set Up Smart Exit</Trans>
              </Text>
              <X onClick={onDismiss} />
            </Flex>

            <Flex justifyContent="space-between" alignItems="center">
              <PositionDetailHeader
                style={{ flexDirection: 'row' }}
                position={position}
                showBackIcon={false}
                isLoading={false}
                initialLoading={false}
                rightComponent={<></>}
              />
              <ExpireSetting expireTime={expireTime} setExpireTime={setExpireTime} />
            </Flex>

            <ContentWrapper>
              <Flex flexDirection="column" sx={{ gap: '1rem' }} flex={1}>
                <PositionLiquidity position={position} />
                <PoolPrice position={position} />
              </Flex>

              <Flex flexDirection="column" flex={1} sx={{ gap: '1rem' }}>
                <Metrics
                  position={position}
                  selectedMetrics={selectedMetrics}
                  setSelectedMetrics={setSelectedMetrics}
                  conditionType={conditionType}
                  setConditionType={setConditionType}
                />
                <GasSetting
                  feeInfo={feeInfo}
                  multiplier={multiplier}
                  setMultiplier={setMultiplier}
                  customGasPercent={customGasPercent}
                  setCustomGasPercent={setCustomGasPercent}
                />
              </Flex>
            </ContentWrapper>

            <Actions
              onDismiss={onDismiss}
              onPreview={() => !disabled && setShowConfirm(true)}
              disabled={disabled}
              feeLoading={feeLoading}
            />
          </>
        )}
      </Flex>
    </Modal>
  )
}
