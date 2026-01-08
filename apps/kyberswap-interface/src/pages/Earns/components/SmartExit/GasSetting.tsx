import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'

import Input from 'components/NumericalInput'
import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { GAS_MULTIPLIER_PRESETS } from 'pages/Earns/components/SmartExit/constants'
import { CustomOption } from 'pages/Earns/components/SmartExit/styles'
import { SmartExitFee } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

interface GasSettingProps {
  feeInfo: SmartExitFee | null
  multiplier: number
  setMultiplier: (value: number) => void
  customGasPercent: string
  setCustomGasPercent: (value: string) => void
  isLoading?: boolean
}

export default function GasSetting({
  feeInfo,
  multiplier,
  setMultiplier,
  customGasPercent,
  setCustomGasPercent,
  isLoading = false,
}: GasSettingProps) {
  const theme = useTheme()
  const [feeSettingExpanded, setFeeSettingExpanded] = useState(false)

  const isWarningGas = feeInfo && customGasPercent && parseFloat(customGasPercent) < (feeInfo.gas.percentage || 0)
  const isHighlightGas =
    feeInfo &&
    !feeSettingExpanded &&
    (customGasPercent ? parseFloat(customGasPercent) > feeInfo.gas.percentage : multiplier > 1)

  if (isLoading) {
    return (
      <Flex flexDirection="column" sx={{ gap: '4px' }}>
        <Flex alignItems="center" justifyContent="space-between">
          <PositionSkeleton width={120} height={20} />
          <PositionSkeleton width={100} height={20} />
        </Flex>
      </Flex>
    )
  }

  if (!feeInfo) return null
  return (
    <Flex flexDirection="column" sx={{ gap: '4px' }}>
      <Flex alignItems="center" justifyContent="space-between">
        <Text>{t`Max Execution Gas`}:</Text>
        {!feeInfo ? (
          <Text>--</Text>
        ) : (
          <Flex alignItems="center" onClick={() => setFeeSettingExpanded(e => !e)} style={{ cursor: 'default' }}>
            <Text color={isWarningGas ? rgba(theme.warning, 0.9) : theme.text}>
              {customGasPercent
                ? customGasPercent
                : formatDisplayNumber(feeInfo.gas.percentage * multiplier, { significantDigits: 4 })}
              %
            </Text>
            <Text color={isWarningGas ? rgba(theme.warning, 0.9) : theme.text} marginLeft={1.5}>
              (~
              {formatDisplayNumber(
                feeInfo.gas.usd *
                  (customGasPercent ? parseFloat(customGasPercent) / feeInfo.gas.percentage : multiplier),
                { significantDigits: 2, style: 'currency' },
              )}
              )
            </Text>
            <DropdownIcon
              data-flip={feeSettingExpanded}
              data-highlight={isHighlightGas}
              data-warning={isWarningGas}
              size={16}
            >
              <ChevronDown />
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
          {GAS_MULTIPLIER_PRESETS.map(item => {
            const isSelected = !customGasPercent && multiplier === item
            return (
              <CustomOption
                key={item}
                onClick={() => {
                  setCustomGasPercent('')
                  setMultiplier(item)
                }}
                isSelected={isSelected}
              >
                {formatDisplayNumber(item * (feeInfo?.gas.percentage || 0), { significantDigits: 2 })}%
              </CustomOption>
            )
          })}

          {/* Custom option */}
          <CustomOption
            key="custom"
            sx={{
              color: customGasPercent ? theme.primary : undefined,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Input
              value={customGasPercent}
              onUserInput={v => setCustomGasPercent(v)}
              placeholder={t`Custom`}
              style={{
                width: '100%',
                background: 'transparent',
                fontSize: '12px',
              }}
            />
            <Text as="span" color="inherit" fontSize={12}>
              %
            </Text>
          </CustomOption>
        </Flex>
        <Flex flexDirection="column" sx={{ gap: '4px' }}>
          <Flex alignItems="center" sx={{ gap: '4px' }}>
            <Text fontSize={12} color={theme.subText}>
              {t`Current est. gas`} = {formatDisplayNumber(feeInfo?.gas.percentage || 0, { significantDigits: 2 })}%
            </Text>
            <Text fontSize={12} color={theme.subText}>
              (~
              {formatDisplayNumber(feeInfo.gas.usd, { significantDigits: 2, style: 'currency' })})
            </Text>
          </Flex>
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
    </Flex>
  )
}
