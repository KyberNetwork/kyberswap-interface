import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import Modal from 'components/Modal'
import { TIMES_IN_SECS } from 'constants/index'
import PositionDetailHeader from 'pages/Earns/PositionDetail/Header'
import Actions from 'pages/Earns/components/SmartExit/Actions'
import { Confirmation } from 'pages/Earns/components/SmartExit/Confirmation'
import ExpireSetting from 'pages/Earns/components/SmartExit/ExpireSetting'
import GasSetting from 'pages/Earns/components/SmartExit/GasSetting'
import { Metrics } from 'pages/Earns/components/SmartExit/Metrics'
import PoolPrice from 'pages/Earns/components/SmartExit/PoolPrice'
import PositionLiquidity from 'pages/Earns/components/SmartExit/PositionLiquidity'
import { ContentWrapper } from 'pages/Earns/components/SmartExit/styles'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { defaultFeeYieldCondition } from 'pages/Earns/components/SmartExit/utils'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  ParsedPosition,
  PriceCondition,
  SelectedMetric,
  SmartExitFee,
  TimeCondition,
} from 'pages/Earns/types'

export const SmartExit = ({ position, onDismiss }: { position: ParsedPosition; onDismiss: () => void }) => {
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([
    { metric: Metric.FeeYield, condition: defaultFeeYieldCondition },
  ])
  const [conditionType, setConditionType] = useState<ConditionType>(ConditionType.And)

  const [expireTime, setExpireTime] = useState(TIMES_IN_SECS.ONE_DAY * 30)
  const deadline = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const time = [7 * TIMES_IN_SECS.ONE_DAY, 30 * TIMES_IN_SECS.ONE_DAY, 90 * TIMES_IN_SECS.ONE_DAY].includes(
      expireTime,
    )
      ? Math.floor(today.getTime()) + expireTime * 1000
      : expireTime

    return Math.floor(time / 1000)
  }, [expireTime])

  const invalidYieldCondition = useMemo(() => {
    const feeYieldMetric = selectedMetrics.find(metric => metric.metric === Metric.FeeYield)
    const feeYieldCondition = feeYieldMetric?.condition as FeeYieldCondition
    return feeYieldMetric && !feeYieldCondition
  }, [selectedMetrics])

  const invalidPriceCondition = useMemo(() => {
    const priceMetric = selectedMetrics.find(metric => metric.metric === Metric.PoolPrice)
    const priceCondition = priceMetric?.condition as PriceCondition
    return (
      priceMetric &&
      (!priceCondition.gte || !priceCondition.lte || Number(priceCondition.gte) > Number(priceCondition.lte))
    )
  }, [selectedMetrics])

  const invalidTimeCondition = useMemo(() => {
    const timeMetric = selectedMetrics.find(metric => metric.metric === Metric.Time)
    const timeCondition = timeMetric?.condition as TimeCondition
    return timeMetric && !timeCondition.time
  }, [selectedMetrics])

  const [showConfirm, setShowConfirm] = useState(false)

  // Gas estimation + selection state
  const [feeInfo, setFeeInfo] = useState<SmartExitFee | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const [multiplier, setMultiplier] = useState<number>(1.5)
  const [customGasUsd, setCustomGasUsd] = useState<string>('')
  const intervalRef = useRef<number | null>(null)

  const { estimateFee } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
  })

  const disabled = invalidYieldCondition || invalidPriceCondition || invalidTimeCondition || !feeInfo

  // Auto-estimate when metrics are valid
  useEffect(() => {
    if (invalidYieldCondition || invalidPriceCondition || invalidTimeCondition) return

    const call = async () => {
      if (feeLoading || feeInfo) return
      setFeeLoading(true)
      try {
        const res = await estimateFee()
        setFeeInfo(res)
      } catch {
        if (feeInfo) setFeeInfo(null)
      } finally {
        setFeeLoading(false)
      }
    }

    call()
    intervalRef.current = window.setInterval(call, 15000)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidYieldCondition || invalidPriceCondition || invalidTimeCondition])

  return (
    <Modal isOpen mobileFullWidth onDismiss={onDismiss} width="100vw" maxWidth={showConfirm ? 450 : 800}>
      <Flex width="100%" flexDirection="column" padding="20px">
        {showConfirm ? (
          <Confirmation
            selectedMetrics={selectedMetrics}
            conditionType={conditionType}
            deadline={deadline}
            position={position}
            onDismiss={() => setShowConfirm(false)}
            feeSettings={{
              protocolFee: feeInfo?.protocol.percentage || 0,
              maxFeesPercentage:
                (feeInfo?.gas.percentage || 0) *
                  (customGasUsd ? parseFloat(customGasUsd) / (feeInfo?.gas.usd ?? 0) : multiplier) +
                (feeInfo?.protocol.percentage || 0),
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

            <PositionDetailHeader
              style={{ flexDirection: 'row' }}
              position={position}
              showBackIcon={false}
              isLoading={false}
              initialLoading={false}
              rightComponent={<></>}
            />

            <ContentWrapper>
              <Flex flexDirection="column" sx={{ gap: '1rem' }} flex={1}>
                <PositionLiquidity position={position} />
                <PoolPrice position={position} />
              </Flex>

              <Flex flexDirection="column" flex={1}>
                <Metrics
                  position={position}
                  selectedMetrics={selectedMetrics}
                  setSelectedMetrics={setSelectedMetrics}
                  conditionType={conditionType}
                  setConditionType={setConditionType}
                />
                <Divider my="1rem" />
                <ExpireSetting expireTime={expireTime} setExpireTime={setExpireTime} />
                <Divider my="1rem" />
                <GasSetting
                  feeInfo={feeInfo}
                  multiplier={multiplier}
                  setMultiplier={setMultiplier}
                  customGasUsd={customGasUsd}
                  setCustomGasUsd={setCustomGasUsd}
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
