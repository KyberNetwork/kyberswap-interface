import { Label, RadioGroup, RadioGroupItem } from '@kyber/ui'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Calendar } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import useTheme from 'hooks/useTheme'
import { DEFAULT_TIME_OPTIONS } from 'pages/Earns/components/SmartExit/ExpireSetting'
import { CustomInput, CustomSelect } from 'pages/Earns/components/SmartExit/styles'
import { getDefaultCondition } from 'pages/Earns/components/SmartExit/utils'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  ParsedPosition,
  PriceCondition,
  SelectedMetric,
  TimeCondition,
} from 'pages/Earns/types'
import { ButtonText } from 'theme'

const supportedMetrics = [Metric.FeeYield, Metric.PoolPrice, Metric.Time]

export const Metrics = ({
  position,
  selectedMetrics,
  setSelectedMetrics,
  conditionType,
  setConditionType,
}: {
  position: ParsedPosition
  selectedMetrics: SelectedMetric[]
  setSelectedMetrics: (value: SelectedMetric[]) => void
  conditionType: ConditionType
  setConditionType: (v: ConditionType) => void
}) => {
  const theme = useTheme()
  const [metric1, metric2] = selectedMetrics

  const onChangeMetric1 = (value: SelectedMetric) => setSelectedMetrics(metric2 ? [value, metric2] : [value])
  const onChangeMetric2 = (value: SelectedMetric) => setSelectedMetrics([metric1, value])
  const onRemoveMetric2 = () => setSelectedMetrics([metric1])
  const onAddMetric2 = () => {
    const newMetric = supportedMetrics.filter(item => item === Metric.PoolPrice || item !== metric1.metric)[0]
    const newCondition = getDefaultCondition(newMetric)
    if (!newCondition) return
    setSelectedMetrics([metric1, { metric: newMetric, condition: newCondition }])
  }

  return (
    <Flex flexDirection="column">
      <MetricSelect metric={metric1} setMetric={onChangeMetric1} selectedMetric={metric2} position={position} />
      <Divider my="1rem" />
      {metric2 ? (
        <>
          <Flex justifyContent="space-between" alignItems="center">
            <RadioGroup value={conditionType} onValueChange={v => setConditionType(v as ConditionType)}>
              <Flex sx={{ gap: '8px' }}>
                <RadioGroupItem value={ConditionType.And} id={ConditionType.And} />
                <Label htmlFor={ConditionType.And}>
                  <Trans>And</Trans>
                </Label>

                <RadioGroupItem value={ConditionType.Or} id={ConditionType.Or} style={{ marginLeft: '24px' }} />
                <Label htmlFor={ConditionType.Or}>
                  <Trans>Or</Trans>
                </Label>
              </Flex>
            </RadioGroup>
            <ButtonText
              style={{
                width: 'fit-content',
                color: theme.red,
                fontSize: '14px',
              }}
              onClick={onRemoveMetric2}
            >
              <Trans>Remove Condition</Trans>
            </ButtonText>
          </Flex>
          <Divider my="1rem" />
          <MetricSelect metric={metric2} setMetric={onChangeMetric2} selectedMetric={metric1} position={position} />
        </>
      ) : (
        <ButtonText
          style={{
            width: 'fit-content',
            color: theme.primary,
          }}
          onClick={onAddMetric2}
        >
          + <Trans>Add Condition 2</Trans>
        </ButtonText>
      )}
    </Flex>
  )
}

const MetricSelect = ({
  metric,
  setMetric,
  selectedMetric,
  position,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  selectedMetric?: SelectedMetric
  position: ParsedPosition
}) => {
  const theme = useTheme()
  const [openDatePicker, setOpenDatePicker] = useState(false)

  const metricOptions = useMemo(
    () =>
      [
        {
          label: t`Fee Yield`,
          value: Metric.FeeYield,
        },
        {
          label: t`Pool Price`,
          value: Metric.PoolPrice,
        },
        {
          label: t`Time`,
          value: Metric.Time,
        },
      ].filter(item => item.value === Metric.PoolPrice || item.value !== selectedMetric?.metric),
    [selectedMetric],
  )

  const timeOptions = useMemo(
    () => [
      {
        label: t`Before`,
        value: 'before',
      },
      {
        label: t`After`,
        value: 'after',
      },
    ],
    [],
  )

  const feeYieldCondition = metric.condition as FeeYieldCondition
  const priceCondition = metric.condition as PriceCondition
  const timeCondition = metric.condition as TimeCondition

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between" mb="1rem">
        <Text>
          <Trans>Select Metric</Trans>
        </Text>
        <CustomSelect
          options={metricOptions}
          onChange={value => {
            if (value === metric.metric) return
            const newMetric = value as Metric
            const condition = getDefaultCondition(newMetric)
            if (!condition) return
            setMetric({ metric: newMetric, condition })
          }}
          value={metric.metric}
          menuStyle={{ width: '250px' }}
        />
      </Flex>

      {metric.metric === Metric.FeeYield && (
        <>
          <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
            <Text>
              <Trans>Exit when fee yield ≥</Trans>
            </Text>
            <Flex sx={{ position: 'relative' }} flex={1}>
              <CustomInput
                value={feeYieldCondition}
                onChange={e => {
                  const value = e.target.value
                  // Only allow numbers and decimal point
                  if (/^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value)
                    // Limit to 1-100%
                    if (value === '' || numValue > 0) {
                      setMetric({ ...metric, condition: value })
                    }
                  }
                }}
                placeholder="0"
              />
              <Text
                sx={{
                  top: '8px',
                  right: '8px',
                  position: 'absolute',
                }}
              >
                %
              </Text>
            </Flex>
          </Flex>
          <Flex justifyContent="flex-end" sx={{ gap: '4px' }} mt="8px">
            {[5, 10, 15, 20].map(item => {
              const isSelected = metric.condition === item.toString()

              return (
                <Box
                  key={item}
                  onClick={() => setMetric({ ...metric, condition: item.toString() })}
                  sx={{
                    borderRadius: '999px',
                    border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                    backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
                    padding: '4px 12px',
                    color: isSelected ? theme.primary : theme.subText,
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.primary + '10',
                    },
                  }}
                >
                  {item}%
                </Box>
              )
            })}
          </Flex>
        </>
      )}

      {metric.metric === Metric.PoolPrice && (
        <>
          <Text>
            <Trans>Exit when the pool price is between</Trans>
          </Text>
          <Flex sx={{ gap: '0.5rem' }} alignItems={'center'} mt="8px">
            <CustomInput
              placeholder="Min price"
              value={priceCondition.gte}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  setMetric({ ...metric, condition: { ...priceCondition, gte: value } })
                }
              }}
            />
            -
            <CustomInput
              placeholder="Max price"
              value={priceCondition.lte}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  setMetric({ ...metric, condition: { ...priceCondition, lte: value } })
                }
              }}
            />
            <Text width="max-content">
              {position.token0.symbol}/{position.token1.symbol}
            </Text>
          </Flex>
        </>
      )}

      {metric.metric === Metric.Time && (
        <>
          <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
            <Text>
              <Trans>Exit this position</Trans>
            </Text>
            <CustomSelect
              options={timeOptions}
              onChange={value => {
                setMetric({ ...metric, condition: { ...timeCondition, condition: value } })
              }}
              value={timeCondition.condition}
              menuStyle={{ width: '250px' }}
            />
          </Flex>
          <Text mt="16px">
            <Trans>Set Schedule</Trans>
          </Text>
          <Flex
            sx={{
              borderRadius: '12px',
              background: theme.buttonBlack,
              padding: '8px 12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              cursor: 'pointer',
            }}
            role="button"
            onClick={() => setOpenDatePicker(true)}
          >
            <Text>
              {timeCondition.time === null ? 'DD/MM/YYYY' : dayjs(timeCondition.time).format('DD/MM/YYYY HH:mm:ss')}
            </Text>
            <Calendar color={theme.primary} size={20} />
          </Flex>

          <DateTimePicker
            title={<Trans>Time Setup</Trans>}
            isOpen={openDatePicker}
            onDismiss={() => setOpenDatePicker(false)}
            onSetDate={(val: Date | number) => {
              setMetric({
                ...metric,
                condition: { ...timeCondition, time: typeof val === 'number' ? val : val.getTime() },
              })
            }}
            expire={
              timeCondition.time || 5 * 60 // 5min
            }
            defaultOptions={DEFAULT_TIME_OPTIONS}
          />
        </>
      )}
    </>
  )
}
