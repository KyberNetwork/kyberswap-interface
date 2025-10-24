import { Label, RadioGroup, RadioGroupItem } from '@kyber/ui'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Calendar } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import Divider from 'components/Divider'
import Input from 'components/Input'
import Select from 'components/Select'
import { DefaultSlippageOption } from 'components/SlippageControl'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ParsedPosition } from 'pages/Earns/types'
import { ButtonText } from 'theme'
import { formatTimeDuration } from 'utils/time'

export enum Metric {
  FeeYield = 'fee_yield',
  PoolPrice = 'pool_price',
  Time = 'time',
}

const defaultOptions = [
  5 * TIMES_IN_SECS.ONE_MIN,
  10 * TIMES_IN_SECS.ONE_MIN,
  TIMES_IN_SECS.ONE_HOUR,
  TIMES_IN_SECS.ONE_DAY,
  3 * TIMES_IN_SECS.ONE_DAY,
  7 * TIMES_IN_SECS.ONE_DAY,
  30 * TIMES_IN_SECS.ONE_DAY,
].map(e => ({ value: e, label: formatTimeDuration(e) }))

export const Metrics = ({
  position,
  selectedMetrics,
  setSelectedMetrics,
  conditionType,
  setConditionType,
  expireTime,
  setExpireTime,
  feeYieldCondition,
  setFeeYieldCondition,
  priceCondition,
  setPriceCondition,
  timeCondition,
  setTimeCondition,
}: {
  position: ParsedPosition
  selectedMetrics: [Metric, Metric | null]
  setSelectedMetrics: (value: [Metric, Metric | null]) => void
  conditionType: 'and' | 'or'
  setConditionType: (v: 'and' | 'or') => void
  expireTime: number
  setExpireTime: (v: number) => void
  feeYieldCondition: string
  setFeeYieldCondition: (v: string) => void
  priceCondition: { lte: string; gte: string }
  setPriceCondition: (v: { lte: string; gte: string }) => void
  timeCondition: { time: number | null; condition: 'after' | 'before' }
  setTimeCondition: (v: { time: number | null; condition: 'after' | 'before' }) => void
}) => {
  const theme = useTheme()
  const [metric1, metric2] = selectedMetrics

  const displayTime =
    expireTime % TIMES_IN_SECS.ONE_DAY === 0
      ? `${expireTime / TIMES_IN_SECS.ONE_DAY}D`
      : dayjs(expireTime).format('DD/MM/YYYY HH:mm:ss')

  const [openDatePicker, setOpenDatePicker] = useState(false)

  return (
    <Flex flexDirection="column" flex={1}>
      <MetricSelect
        metric={metric1}
        setMetric={(value: Metric) => {
          setSelectedMetrics([value, metric2])
        }}
        selectedMetric={metric2}
        position={position}
        feeYieldCondition={feeYieldCondition}
        setFeeYieldCondition={setFeeYieldCondition}
        priceCondition={priceCondition}
        setPriceCondition={setPriceCondition}
        timeCondition={timeCondition}
        setTimeCondition={setTimeCondition}
      />
      <Divider my="1rem" />
      {metric2 ? (
        <>
          <Flex justifyContent="space-between" alignItems="center">
            <RadioGroup value={conditionType} onValueChange={v => setConditionType(v as 'and' | 'or')}>
              <Flex sx={{ gap: '8px' }}>
                <RadioGroupItem value={'and'} id="and" />
                <Label htmlFor="and">And</Label>

                <RadioGroupItem value={'or'} id="or" style={{ marginLeft: '24px' }} />
                <Label htmlFor="or">Or</Label>
              </Flex>
            </RadioGroup>
            <ButtonText
              style={{
                width: 'fit-content',
                color: theme.red,
                fontSize: '14px',
              }}
              onClick={() => {
                setSelectedMetrics([metric1, null])
              }}
            >
              <Trans>Remove Condition</Trans>
            </ButtonText>
          </Flex>
          <Divider my="1rem" />
          <MetricSelect
            metric={metric2}
            setMetric={v => {
              setSelectedMetrics([metric1, v])
            }}
            selectedMetric={metric1}
            position={position}
            feeYieldCondition={feeYieldCondition}
            setFeeYieldCondition={setFeeYieldCondition}
            priceCondition={priceCondition}
            setPriceCondition={setPriceCondition}
            timeCondition={timeCondition}
            setTimeCondition={setTimeCondition}
          />
        </>
      ) : (
        <ButtonText
          style={{
            width: 'fit-content',
            color: theme.primary,
          }}
          onClick={() => {
            setSelectedMetrics([
              metric1,
              [Metric.FeeYield, Metric.PoolPrice, Metric.Time].filter(item => item !== metric1)[0],
            ])
          }}
        >
          + Add Condition 2
        </ButtonText>
      )}
      <Divider my="1rem" />

      <DateTimePicker
        defaultOptions={defaultOptions}
        isOpen={openDatePicker}
        onDismiss={() => {
          setOpenDatePicker(false)
        }}
        onSetDate={(val: Date | number) => {
          setExpireTime(typeof val === 'number' ? val : val.getTime())
        }}
        expire={expireTime}
      />

      <Flex alignItems="center" sx={{ gap: '4px' }} justifyContent="space-between">
        <TextDashed
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 'fit-content',
          }}
        >
          <MouseoverTooltip
            placement="right"
            text={t`Once an order expires, it will be cancelled automatically. No gas fees will be charged.`}
          >
            <Trans>Expires in</Trans>
          </MouseoverTooltip>
        </TextDashed>
        <Flex
          sx={{
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
          role="button"
        >
          <Text
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1',
              color: theme.text,
            }}
          >
            <Text color={theme.text} fontSize={14}>
              {displayTime}
            </Text>
          </Text>
        </Flex>
      </Flex>
      <Flex
        sx={{
          paddingTop: '8px',
          height: '36px',
        }}
      >
        <Flex
          sx={{
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '100%',
            height: '28px',
            borderRadius: '20px',
            background: theme.tabBackground,
            padding: '2px',
          }}
        >
          {[
            { label: '7D', value: TIMES_IN_SECS.ONE_DAY * 7 },
            { label: '30D', value: TIMES_IN_SECS.ONE_DAY * 30 },
            { label: '90D', value: TIMES_IN_SECS.ONE_DAY * 90 },
            {
              label: 'Custom',
              onSelect: () => {
                setOpenDatePicker(true)
              },
            },
          ].map((item: any) => {
            return (
              <DefaultSlippageOption
                key={item.label}
                onClick={() => {
                  if (item.label === 'Custom') item.onSelect()
                  else setExpireTime(item.value)
                }}
                data-active={
                  item.label === 'Custom' ? expireTime % TIMES_IN_SECS.ONE_DAY != 0 : item.value === expireTime
                }
              >
                {item.label}
              </DefaultSlippageOption>
            )
          })}
        </Flex>
      </Flex>
    </Flex>
  )
}

const MetricSelect = ({
  metric,
  setMetric,
  selectedMetric,
  position,
  feeYieldCondition,
  setFeeYieldCondition,
  priceCondition,
  setPriceCondition,
  timeCondition,
  setTimeCondition,
}: {
  metric: Metric
  setMetric: (value: Metric) => void
  selectedMetric: Metric | null
  position: ParsedPosition
  feeYieldCondition: string
  setFeeYieldCondition: (v: string) => void
  priceCondition: { lte: string; gte: string }
  setPriceCondition: (v: { lte: string; gte: string }) => void
  timeCondition: { time: number | null; condition: 'after' | 'before' }
  setTimeCondition: (v: { time: number | null; condition: 'after' | 'before' }) => void
}) => {
  const theme = useTheme()

  const inputStyle = {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '16px',
    color: theme.text,
    flex: 1,
  }

  const [openDatePicker, setOpenDatePicker] = useState(false)

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between" mb="1rem">
        <Text>
          <Trans>Select Metric</Trans>
        </Text>
        <Select
          style={{ width: '100%', padding: '4px 12px', flex: 1, fontSize: '14px', color: theme.text }}
          options={[
            {
              label: 'Fee Yield',
              value: Metric.FeeYield,
            },
            {
              label: 'Pool Price',
              value: Metric.PoolPrice,
            },
            {
              label: 'Time',
              value: Metric.Time,
            },
          ].filter(item => item.value !== selectedMetric)}
          onChange={value => {
            setMetric(value)
          }}
          value={metric}
          menuStyle={{ width: '250px' }}
        />
      </Flex>
      {metric === Metric.FeeYield && (
        <>
          <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
            <Text>
              <Trans>Exit when fee yield ≥</Trans>
            </Text>
            <Flex sx={{ position: 'relative' }} flex={1}>
              <Input
                style={inputStyle}
                value={feeYieldCondition}
                onChange={e => {
                  const value = e.target.value
                  // Only allow numbers and decimal point
                  if (/^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value)
                    // Limit to 1-100%
                    if (value === '' || numValue > 0) {
                      setFeeYieldCondition(value)
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
              const isSelected = feeYieldCondition === item.toString()
              return (
                <Box
                  key={item}
                  onClick={() => setFeeYieldCondition(item.toString())}
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

      {metric === Metric.PoolPrice && (
        <>
          <Text>
            <Trans>Exit when the pool price is between</Trans>
          </Text>
          <Flex sx={{ gap: '0.5rem' }} alignItems={'center'} mt="8px">
            <Input
              style={inputStyle}
              placeholder="Min price"
              value={priceCondition.gte}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  setPriceCondition({ ...priceCondition, gte: value })
                }
              }}
            />
            -
            <Input
              style={inputStyle}
              placeholder="Max price"
              value={priceCondition.lte}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  setPriceCondition({ ...priceCondition, lte: value })
                }
              }}
            />
            <Text width="max-content">
              {position.token0.symbol}/{position.token1.symbol}
            </Text>
          </Flex>
        </>
      )}

      {metric === Metric.Time && (
        <>
          <Flex alignItems="center" sx={{ gap: '1rem' }} justifyContent="space-between">
            <Text>
              <Trans>Exit this position</Trans>
            </Text>
            <Select
              style={{ width: '100%', padding: '4px 12px', flex: 1, fontSize: '14px', color: theme.text }}
              options={[
                {
                  label: 'Before',
                  value: 'before',
                },
                {
                  label: 'After',
                  value: 'after',
                },
              ]}
              onChange={value => {
                setTimeCondition({
                  time: timeCondition.time,
                  condition: value,
                })
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
            onDismiss={() => {
              setOpenDatePicker(false)
            }}
            onSetDate={(val: Date | number) => {
              setTimeCondition({
                ...timeCondition,
                time: typeof val === 'number' ? val : val.getTime(),
              })
            }}
            expire={
              timeCondition.time || 5 * 60 // 5min
            }
            defaultOptions={defaultOptions}
          />
        </>
      )}
    </>
  )
}
