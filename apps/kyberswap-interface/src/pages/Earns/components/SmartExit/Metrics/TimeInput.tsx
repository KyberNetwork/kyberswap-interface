import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
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
  selectedMetric,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  selectedMetric?: SelectedMetric | null
}) {
  const theme = useTheme()
  const [openDatePicker, setOpenDatePicker] = useState(false)

  const timeOptions = useMemo(
    () => [
      {
        label: t`Before`,
        value: 'before',
        disabled: !selectedMetric,
      },
      {
        label: t`After`,
        value: 'after',
        disabled: false,
      },
    ],
    [selectedMetric],
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
          menuStyle={{ width: '220px', marginTop: '2px' }}
          arrow="chevron"
          arrowSize={16}
          arrowColor={theme.border}
        />
      </Flex>
      <Text>
        <Trans>Set Schedule</Trans>
      </Text>
      <Flex
        sx={{
          borderRadius: '12px',
          background: rgba(theme.text, 0.04),
          padding: '8px 12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        role="button"
        onClick={() => setOpenDatePicker(true)}
      >
        <Text color={timeCondition.time === null ? theme.border : theme.text}>
          {timeCondition.time === null ? t`Pickup time` : dayjs(timeCondition.time).format('DD/MM/YYYY HH:mm:ss')}
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
