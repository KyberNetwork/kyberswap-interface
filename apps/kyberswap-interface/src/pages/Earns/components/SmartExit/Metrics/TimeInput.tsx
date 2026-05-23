import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Calendar } from 'react-feather'

import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import useTheme from 'hooks/useTheme'
import { DEFAULT_TIME_OPTIONS } from 'pages/Earns/components/SmartExit/ExpireSetting'
import { HighlightWrapper } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import { CustomSelect } from 'pages/Earns/components/SmartExit/styles'
import { defaultTimeCondition } from 'pages/Earns/components/SmartExit/utils'
import { getTimeCondition } from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { SelectedMetric } from 'pages/Earns/types'
import { hexAlpha } from 'utils/colorAlpha'

export default function TimeInput({
  metric,
  setMetric,
  selectedMetric,
  isHighlighted = false,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  selectedMetric?: SelectedMetric | null
  isHighlighted?: boolean
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
  const timeCondition = getTimeCondition(metric) || defaultTimeCondition

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span>
          <Trans>Exit this position</Trans>
        </span>
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
      </div>
      <span>
        <Trans>Set Schedule</Trans>
      </span>
      <HighlightWrapper isHighlighted={isHighlighted}>
        <div
          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2"
          style={{ background: hexAlpha(theme.text, 0.04) }}
          role="button"
          onClick={() => setOpenDatePicker(true)}
        >
          <span style={{ color: timeCondition.time === null ? theme.border : theme.text }}>
            {timeCondition.time === null ? t`Pickup time` : dayjs(timeCondition.time).format('DD/MM/YYYY HH:mm:ss')}
          </span>
          <Calendar color={theme.primary} size={20} />
        </div>
      </HighlightWrapper>

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
        expire={timeCondition.time || 5 * 60}
        defaultOptions={DEFAULT_TIME_OPTIONS}
      />
    </>
  )
}
