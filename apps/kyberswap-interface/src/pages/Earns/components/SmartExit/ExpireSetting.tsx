import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { Sliders } from 'react-feather'
import { Flex, Text } from 'rebass'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import { TIMES_IN_SECS } from 'constants/index'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { EXPIRE_TIME_PRESETS, FOREVER_EXPIRE_TIME } from 'pages/Earns/components/SmartExit/constants'
import { CustomOption, SettingButton, SettingContainer, SettingMenu } from 'pages/Earns/components/SmartExit/styles'
import { formatTimeDuration } from 'utils/time'

export const DEFAULT_TIME_OPTIONS = [
  5 * TIMES_IN_SECS.ONE_MIN,
  10 * TIMES_IN_SECS.ONE_MIN,
  TIMES_IN_SECS.ONE_HOUR,
  TIMES_IN_SECS.ONE_DAY,
  3 * TIMES_IN_SECS.ONE_DAY,
  7 * TIMES_IN_SECS.ONE_DAY,
  30 * TIMES_IN_SECS.ONE_DAY,
].map(e => ({ value: e, label: formatTimeDuration(e) }))

export default function ExpireSetting({
  expireTime,
  setExpireTime,
}: {
  expireTime: number
  setExpireTime: (v: number) => void
}) {
  const theme = useTheme()
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [customDefaultDate, setCustomDefaultDate] = useState<Date | undefined>(undefined)
  const settingRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(settingRef, () => setOpenSetting(false))

  const displayTime = useMemo(
    () =>
      expireTime === FOREVER_EXPIRE_TIME
        ? 'Forever'
        : expireTime % TIMES_IN_SECS.ONE_DAY === 0
        ? `${expireTime / TIMES_IN_SECS.ONE_DAY}D`
        : dayjs(expireTime).format('DD/MM/YYYY HH:mm:ss'),
    [expireTime],
  )

  return (
    <>
      <DateTimePicker
        defaultOptions={DEFAULT_TIME_OPTIONS}
        isOpen={openDatePicker}
        onDismiss={() => {
          setOpenDatePicker(false)
          setCustomDefaultDate(undefined)
        }}
        onSetDate={(val: Date | number) => setExpireTime(typeof val === 'number' ? val : val.getTime())}
        expire={expireTime}
        defaultDate={customDefaultDate}
      />

      <SettingContainer ref={settingRef}>
        <Flex justifyContent="flex-end">
          <SettingButton type="button" onClick={() => setOpenSetting(v => !v)} aria-label={t`Open settings`}>
            <Sliders size={16} />
          </SettingButton>
        </Flex>

        {openSetting && (
          <SettingMenu>
            <Flex alignItems="center" justifyContent="space-between">
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
                  <Trans>Expires In</Trans>
                </MouseoverTooltip>
              </TextDashed>
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

            <Flex justifyContent="flex-start" sx={{ gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '7D', value: EXPIRE_TIME_PRESETS.SEVEN_DAYS },
                { label: '30D', value: EXPIRE_TIME_PRESETS.THIRTY_DAYS },
                { label: '90D', value: EXPIRE_TIME_PRESETS.NINETY_DAYS },
                { label: 'Forever', value: EXPIRE_TIME_PRESETS.FOREVER },
                {
                  label: 'Custom',
                  onSelect: () => {
                    // Set default date to 1 month from now for the date picker
                    const oneMonthFromNow = new Date(Date.now() + EXPIRE_TIME_PRESETS.THIRTY_DAYS * 1000)
                    setCustomDefaultDate(oneMonthFromNow)
                    setOpenDatePicker(true)
                  },
                },
              ].map((item: any) => {
                return (
                  <CustomOption
                    key={item.label}
                    onClick={() => {
                      if (item.label === 'Custom') item.onSelect()
                      else setExpireTime(item.value)
                    }}
                    isSelected={
                      item.label === 'Custom' ? expireTime % TIMES_IN_SECS.ONE_DAY != 0 : item.value === expireTime
                    }
                  >
                    {item.label}
                  </CustomOption>
                )
              })}
            </Flex>
          </SettingMenu>
        )}
      </SettingContainer>
    </>
  )
}
