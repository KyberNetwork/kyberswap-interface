import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, X } from 'react-feather'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import DatePicker from 'components/DatePicker'
import Modal from 'components/Modal'
import Select, { SelectProps } from 'components/Select'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { formatTimeDuration } from 'utils/time'

const MIN_TIME_MINUTES = 5

const DEFAULT_OPTIONS = [
  TIMES_IN_SECS.ONE_HOUR,
  TIMES_IN_SECS.ONE_DAY,
  7 * TIMES_IN_SECS.ONE_DAY,
  30 * TIMES_IN_SECS.ONE_DAY,
  36500 * TIMES_IN_SECS.ONE_DAY,
].map(e => ({ value: e, label: formatTimeDuration(e) }))

const HOURS = Array.from({ length: 24 }, (_, i) => ({ label: i, value: i }))
const MINS = Array.from({ length: 60 }, (_, i) => ({ label: i, value: i }))

const isToday = (date: Date) => {
  const today = new Date()
  return (
    today.getDate() === date.getDate() &&
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth()
  )
}

export default function DateTimePicker({
  isOpen,
  onDismiss,
  onSetDate,
  expire,
  defaultDate,
  defaultOptions,
  title,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSetDate: (val: Date | number) => void
  expire: number
  defaultDate?: Date
  title?: ReactNode
  defaultOptions?: { label: string; value: number }[]
}) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [date, setDate] = useState(minDate)
  const [min, setMin] = useState(0)
  const [hour, setHour] = useState(0)
  const [defaultExpire, setDefaultExpire] = useState<number | null>(null)

  const setCustomDate = (date: Date, hour: number, min: number) => {
    let newMin = min
    let newHour = hour
    const now = new Date()

    if (isToday(date)) {
      if (hour < now.getHours()) {
        newHour = now.getHours()
      }
      if (newHour === now.getHours() && min < now.getMinutes() + MIN_TIME_MINUTES) {
        newMin = now.getMinutes() + MIN_TIME_MINUTES
      }
    }
    setHour(newHour)
    setMin(newMin)
    setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), newHour, newMin))
    setDefaultExpire(null)
  }

  const onSelectDefaultOption = useCallback((value: number) => {
    const isTimestamp = value > 1000000000
    if (!isTimestamp) setDefaultExpire(value)
    const date = isTimestamp ? new Date(value) : new Date(Date.now() + value * 1000)
    setDate(date)
    setHour(date.getHours())
    setMin(date.getMinutes())
  }, [])

  useEffect(() => {
    if (isOpen) {
      onSelectDefaultOption(expire)
      if (defaultDate) {
        setCustomDate(defaultDate, defaultDate.getHours(), defaultDate.getMinutes())
      }
    }
  }, [isOpen, onSelectDefaultOption, expire, defaultDate])

  const onSetMin = (min: number) => {
    setCustomDate(date, hour, min)
  }

  const onSetHour = (hour: number) => {
    setCustomDate(date, hour, min)
  }
  const theme = useTheme()

  const propsSelect: Partial<SelectProps> = {
    style: { width: 120, borderRadius: 20 },
    className: 'bg-background',
    menuStyle: {
      height: 250,
      overflow: 'scroll',
      textAlign: 'center',
      width: 'fit-content',
    },
    placement: 'left',
  }

  const expireResult = defaultExpire ? Date.now() + defaultExpire * 1000 : date

  const hourOptions = useMemo(() => {
    const now = new Date()
    if (isToday(date)) return HOURS.filter(e => +e.value >= now.getHours())
    return HOURS
  }, [date])

  const minOptions = useMemo(() => {
    const now = new Date()
    if (isToday(date) && hour === now.getHours())
      return MINS.filter(e => +e.value >= now.getMinutes() + MIN_TIME_MINUTES)
    return MINS
  }, [date, hour])

  return (
    <Modal maxWidth={'98vw'} width={'480px'} isOpen={isOpen} enableSwipeGesture={false}>
      <div className="flex w-full flex-col gap-4 px-5 py-6 font-medium max-sm:px-2.5 max-sm:py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">{title || <Trans>Customize the Expiry Time</Trans>}</span>
          <X className="text-text" onClick={onDismiss} cursor="pointer" />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-3.5 whitespace-nowrap rounded-l-2xl bg-background p-2.5 pt-5 text-xs max-md:hidden">
            <span className="text-border">
              <Trans>Default Options</Trans>
            </span>
            {(defaultOptions || DEFAULT_OPTIONS).map(opt => (
              <span
                key={opt.value}
                className="cursor-pointer"
                style={{ color: opt.value === defaultExpire ? theme.primary : theme.subText }}
                onClick={() => opt.value && onSelectDefaultOption(Number(opt.value))}
              >
                {opt.label}
              </span>
            ))}
          </div>
          <div className="flex flex-1 flex-col items-center gap-[5px]">
            <DatePicker value={date} onChange={(date: Date) => setCustomDate(date, hour, min)} />

            <div className="flex w-full justify-between px-2 py-0">
              <Select
                value={hour}
                activeRender={item => (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text">{item?.label}</span>
                    <span>
                      <Trans>Hour</Trans>
                    </span>
                  </div>
                )}
                {...propsSelect}
                options={hourOptions}
                onChange={onSetHour}
              />
              <Select
                value={min}
                activeRender={item => (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text">{item?.label}</span>
                    <span>
                      <Trans>Min</Trans>
                    </span>
                  </div>
                )}
                {...propsSelect}
                options={minOptions}
                onChange={onSetMin}
              />
            </div>
          </div>
        </div>
        <div
          className="flex w-full justify-between rounded-[20px] bg-warning-20 p-3 text-sm"
          style={{
            backgroundColor: title ? 'transparent' : undefined,
            border: title ? `1px solid ${theme.primary}` : undefined,
          }}
        >
          <div className="flex items-center text-subText">
            <Calendar color={title ? theme.primary : theme.warning} size={17} />
            <span className="ml-[5px]">
              {title ? <Trans>Order will trigger on</Trans> : <Trans>Order will Expire on</Trans>}
            </span>
          </div>
          <span className="text-text">{dayjs(expireResult).format('DD/MM/YYYY HH:mm')}</span>
        </div>
        <div className="flex justify-end gap-4">
          <ButtonOutlined
            onClick={onDismiss}
            style={{
              width: 100,
              height: 32,
            }}
          >
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={() => {
              onSetDate(date)
              onDismiss()
            }}
            style={{
              width: 100,
              height: 32,
            }}
          >
            <Trans>Set</Trans>
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}
