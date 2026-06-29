import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar } from 'react-feather'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import DatePicker from 'components/DatePicker'
import Modal from 'components/Modal'
import Select, { SelectProps } from 'components/Select'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'

const MIN_TIME_MINUTES = 5

const getDefaultOptions = () => [
  { value: TIMES_IN_SECS.ONE_HOUR, label: t`1 Hour` },
  { value: TIMES_IN_SECS.ONE_DAY, label: t`1 Day` },
  { value: 7 * TIMES_IN_SECS.ONE_DAY, label: t`7 Days` },
  { value: 30 * TIMES_IN_SECS.ONE_DAY, label: t`30 Days` },
  { value: 36500 * TIMES_IN_SECS.ONE_DAY, label: t`Never Expires` },
]

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
  returnPresetValue,
  title,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSetDate: (val: Date | number) => void
  expire: number
  defaultDate?: Date
  defaultOptions?: { label: string; value: number }[]
  returnPresetValue?: boolean
  title?: ReactNode
}) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [date, setDate] = useState(minDate)
  const [min, setMin] = useState(0)
  const [hour, setHour] = useState(0)
  const [defaultExpire, setDefaultExpire] = useState<number | null>(null)
  const options = useMemo(() => defaultOptions || getDefaultOptions(), [defaultOptions])

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

  const onSelectDefaultOption = useCallback(
    (value: number) => {
      const isDefaultOption = options.some(opt => opt.value === value)
      setDefaultExpire(isDefaultOption ? value : null)
      const date = isDefaultOption ? new Date(Date.now() + value * 1000) : new Date(value)
      setDate(date)
      setHour(date.getHours())
      setMin(date.getMinutes())
    },
    [options],
  )

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
    style: { width: 100, borderRadius: 20 },
    className: 'bg-background px-3 py-1',
    menuStyle: {
      height: 250,
      overflow: 'scroll',
      textAlign: 'center',
      width: 100,
    },
    optionStyle: {
      padding: '8px 8px',
      fontSize: 14,
      textAlign: 'left',
    },
    placement: 'bottom',
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

  const handleSetDate = () => {
    onSetDate(returnPresetValue && defaultExpire ? defaultExpire : date)
    onDismiss()
  }

  return (
    <Modal maxWidth={'98vw'} width={'480px'} isOpen={isOpen} onDismiss={handleSetDate} enableSwipeGesture={false}>
      <div className="flex w-full flex-col gap-4 px-5 py-6 font-medium max-sm:px-2.5 max-sm:py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">{title || <Trans>Customize the Expiry Time</Trans>}</span>
          <CloseIcon onClick={onDismiss} />
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 whitespace-nowrap rounded-xl bg-background px-2 py-3 text-xs max-md:hidden">
            <span className="text-subText">
              <Trans>Default Options</Trans>
            </span>
            <div className="flex flex-col gap-1">
              {options.map(opt => {
                const active = opt.value === defaultExpire

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      'rounded-md px-2 py-1 text-left transition-colors hover:bg-buttonGray hover:text-text',
                      active ? 'text-primary hover:text-primary' : 'text-subText',
                    )}
                    onClick={() => opt.value && onSelectDefaultOption(Number(opt.value))}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-[5px]">
            <DatePicker value={date} onChange={(date: Date) => setCustomDate(date, hour, min)} />

            <div className="flex w-full items-center justify-end gap-2">
              <span className="text-sm text-subText">{dayjs(date).format('DD/MM/YYYY')}</span>
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
          className="flex w-full justify-between rounded-[20px] bg-warning-20 px-3 py-2 text-sm"
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
        <div className="flex justify-end gap-2">
          <ButtonOutlined onClick={onDismiss} className="py-2">
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary className="py-2" onClick={handleSetDate}>
            <Trans>OK</Trans>
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}
