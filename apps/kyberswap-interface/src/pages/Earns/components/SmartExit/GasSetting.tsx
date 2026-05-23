import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'

import Input from 'components/NumericalInput'
import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { GAS_MULTIPLIER_PRESETS } from 'pages/Earns/components/SmartExit/constants'
import { CustomOption } from 'pages/Earns/components/SmartExit/styles'
import { SmartExitFee } from 'pages/Earns/types'
import { hexAlpha } from 'utils/colorAlpha'
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <PositionSkeleton width={120} height={20} />
          <PositionSkeleton width={100} height={20} />
        </div>
      </div>
    )
  }

  if (!feeInfo) return null
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span>{t`Max Execution Gas`}:</span>
        {!feeInfo ? (
          <span>--</span>
        ) : (
          <div
            className="flex items-center"
            onClick={() => setFeeSettingExpanded(e => !e)}
            style={{ cursor: 'default' }}
          >
            <span style={{ color: isWarningGas ? hexAlpha(theme.warning, 0.9) : theme.text }}>
              {customGasPercent
                ? customGasPercent
                : formatDisplayNumber(feeInfo.gas.percentage * multiplier, { significantDigits: 2 })}
              %
            </span>
            <span className="ml-1.5" style={{ color: isWarningGas ? hexAlpha(theme.warning, 0.9) : theme.text }}>
              (~
              {formatDisplayNumber(
                feeInfo.gas.usd *
                  (customGasPercent ? parseFloat(customGasPercent) / feeInfo.gas.percentage : multiplier),
                { significantDigits: 2, style: 'currency' },
              )}
              )
            </span>
            <DropdownIcon
              data-flip={feeSettingExpanded}
              data-highlight={isHighlightGas}
              data-warning={isWarningGas}
              size={16}
            >
              <ChevronDown />
            </DropdownIcon>
          </div>
        )}
      </div>
      <div
        className="flex flex-col gap-3 overflow-hidden transition-all duration-100"
        style={{
          paddingTop: feeSettingExpanded && feeInfo ? '8px' : '0px',
          height: feeSettingExpanded && feeInfo ? 'max-content' : '0px',
        }}
      >
        <div className="flex w-full gap-1.5">
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

          <CustomOption
            key="custom"
            className="flex flex-1 items-center gap-1"
            style={{ color: customGasPercent ? theme.primary : undefined }}
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
            <span className="text-xs text-inherit">%</span>
          </CustomOption>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-subText">
              {t`Current est. gas`} = {formatDisplayNumber(feeInfo?.gas.percentage || 0, { significantDigits: 2 })}%
            </span>
            <span className="text-xs text-subText">
              (~
              {formatDisplayNumber(feeInfo.gas.usd, { significantDigits: 2, style: 'currency' })})
            </span>
          </div>
          <span className="text-xs" style={{ color: isWarningGas ? hexAlpha(theme.warning, 0.9) : theme.subText }}>
            <Trans>
              The buffer amount is recommended. The order will <span className="font-semibold">not execute</span> if the
              actual cost exceeds this.
            </Trans>
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: isWarningGas ? hexAlpha(theme.warning, 0.9) : theme.subText }}
          >
            <Trans>The actual gas cost will be deducted from your outputs when the order executes.</Trans>
          </span>
        </div>
      </div>
    </div>
  )
}
