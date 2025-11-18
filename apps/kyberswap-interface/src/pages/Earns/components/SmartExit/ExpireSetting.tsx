import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'

import { DefaultSlippageOption } from 'components/SlippageControl'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import DateTimePicker from 'components/swapv2/LimitOrder/ExpirePicker'
import { TIMES_IN_SECS } from 'constants/index'
import useTheme from 'hooks/useTheme'
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

  const displayTime = useMemo(
    () =>
      expireTime % TIMES_IN_SECS.ONE_DAY === 0
        ? `${expireTime / TIMES_IN_SECS.ONE_DAY}D`
        : dayjs(expireTime).format('DD/MM/YYYY HH:mm:ss'),
    [expireTime],
  )

  return (
    <>
      <DateTimePicker
        defaultOptions={DEFAULT_TIME_OPTIONS}
        isOpen={openDatePicker}
        onDismiss={() => setOpenDatePicker(false)}
        onSetDate={(val: Date | number) => setExpireTime(typeof val === 'number' ? val : val.getTime())}
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
    </>
  )
}
