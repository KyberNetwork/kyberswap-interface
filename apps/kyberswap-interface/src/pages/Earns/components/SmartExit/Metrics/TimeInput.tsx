import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Calendar } from 'react-feather'
import { Flex, Text } from 'rebass'

import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import useTheme from 'hooks/useTheme'
import { DEFAULT_TIME_OPTIONS } from 'pages/Earns/components/SmartExit/ExpireSetting'
import { CustomSelect } from 'pages/Earns/components/SmartExit/styles'
import { SelectedMetric, TimeCondition } from 'pages/Earns/types'

export default function TimeInput({
  metric,
  setMetric,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
}) {
  const theme = useTheme()
  const [openDatePicker, setOpenDatePicker] = useState(false)

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
  const timeCondition = metric.condition as TimeCondition

  return (
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
  )
}
