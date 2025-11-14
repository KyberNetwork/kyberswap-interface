import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { Box, Flex, Text } from 'rebass'

import Input from 'components/NumericalInput'
import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import useTheme from 'hooks/useTheme'
import { SmartExitFee } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function GasSetting({
  feeInfo,
  multiplier,
  setMultiplier,
  customGasUsd,
  setCustomGasUsd,
}: {
  feeInfo: SmartExitFee | null
  multiplier: number
  setMultiplier: (value: number) => void
  customGasUsd: string
  setCustomGasUsd: (value: string) => void
}) {
  const theme = useTheme()
  const [feeSettingExpanded, setFeeSettingExpanded] = useState(false)

  const isWarningGas = feeInfo && customGasUsd && parseFloat(customGasUsd) < (feeInfo.gas.usd || 0)
  const isHighlightGas =
    feeInfo &&
    !feeSettingExpanded &&
    (customGasUsd ? parseFloat(customGasUsd) > feeInfo.gas.usd : feeInfo.gas.usd * multiplier > feeInfo.gas.usd)

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Text>{t`Max Execution Gas`}:</Text>
        {!feeInfo ? (
          <Text>--</Text>
        ) : (
          <Flex alignItems="center" onClick={() => setFeeSettingExpanded(e => !e)} style={{ cursor: 'default' }}>
            <Text color={isWarningGas ? rgba(theme.warning, 0.9) : theme.text}>
              $
              {customGasUsd
                ? customGasUsd
                : formatDisplayNumber(feeInfo.gas.usd * multiplier, { significantDigits: 2 })}
            </Text>
            <DropdownIcon data-flip={feeSettingExpanded} data-highlight={isHighlightGas} data-warning={isWarningGas}>
              <svg width="10" height="6" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.70711 3.29289L5.29289 1.70711C5.92286 1.07714 5.47669 0 4.58579 0H1.41421C0.523309 0 0.0771406 1.07714 0.707105 1.70711L2.29289 3.29289C2.68342 3.68342 3.31658 3.68342 3.70711 3.29289Z"
                  fill="currentColor"
                />
              </svg>
            </DropdownIcon>
          </Flex>
        )}
      </Flex>
      <Flex
        sx={{
          transition: 'all 100ms linear',
          paddingTop: feeSettingExpanded && feeInfo ? '8px' : '0px',
          height: feeSettingExpanded && feeInfo ? 'max-content' : '0px',
          overflow: 'hidden',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Flex sx={{ gap: '6px', width: '100%' }}>
          {[1, 1.5, 2, 3].map(item => {
            const isSelected = !customGasUsd && multiplier === item
            return (
              <Box
                key={item}
                onClick={() => {
                  setCustomGasUsd('')
                  setMultiplier(item)
                }}
                sx={{
                  borderRadius: '999px',
                  border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                  backgroundColor: isSelected ? theme.primary + '20' : 'transparent',
                  padding: '6px 4px',
                  color: isSelected ? theme.primary : theme.subText,
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'center',
                  flex: 1,
                  '&:hover': {
                    backgroundColor: theme.primary + '10',
                  },
                }}
              >
                ${formatDisplayNumber(item * (feeInfo?.gas.usd || 0), { significantDigits: 2 })}
              </Box>
            )
          })}

          {/* Custom option */}
          <Box
            key="custom"
            sx={{
              borderRadius: '999px',
              border: `1px solid ${customGasUsd ? theme.primary : theme.border}`,
              backgroundColor: customGasUsd ? theme.primary + '20' : 'transparent',
              padding: '2px 10px',
              color: customGasUsd ? theme.primary : theme.subText,
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              '&:hover': {
                backgroundColor: theme.primary + '10',
              },
            }}
          >
            <Text as="span" color="inherit" fontSize={12}>
              $
            </Text>
            <Input
              value={customGasUsd}
              onUserInput={v => setCustomGasUsd(v)}
              placeholder={t`Custom`}
              style={{
                width: '100%',
                background: 'transparent',
                fontSize: '12px',
              }}
            />
          </Box>
        </Flex>
        <Flex flexDirection="column" sx={{ gap: '4px' }}>
          <Text fontSize={12} color={theme.subText}>
            {t`Current est. gas`} = ${formatDisplayNumber(feeInfo?.gas.usd || 0, { significantDigits: 2 })}
          </Text>
          <Text fontSize={12} color={isWarningGas ? rgba(theme.warning, 0.9) : theme.subText}>
            <Trans>
              The buffer amount is recommended. The order will{' '}
              <Text as="span" fontWeight={600}>
                not execute
              </Text>{' '}
              if the actual cost exceeds this.
            </Trans>
          </Text>
          <Text fontSize={12} color={isWarningGas ? rgba(theme.warning, 0.9) : theme.subText} fontWeight={600}>
            <Trans>The actual gas cost will be deducted from your outputs when the order executes.</Trans>
          </Text>
        </Flex>
      </Flex>
    </>
  )
}
