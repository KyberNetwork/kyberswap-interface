import CollapsiblePresetControl, { type CollapsiblePresetControlOption } from 'components/CollapsiblePresetControl'
import { DEFAULT_SLIPPAGES } from 'constants/trade'
import { formatSlippage } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export const DEFAULT_PREPARED_ACTION_SLIPPAGE = 0.5

const SLIPPAGE_OPTIONS: CollapsiblePresetControlOption[] = DEFAULT_SLIPPAGES.map(value => ({
  label: formatSlippage(value),
  value: value / 100,
}))

const formatValue = (value: number) => formatSlippage(value * 100)
const isValueAllowed = (value: number) => value >= 0 && value <= 100

type PreparedActionSlippageControlProps = {
  disabled?: boolean
  onChange: (value: number) => void
  value: number
}

const PreparedActionSlippageControl = ({ disabled, onChange, value }: PreparedActionSlippageControlProps) => (
  <CollapsiblePresetControl
    collapseButtonAriaLabel="Toggle slippage tolerance options"
    customInputAriaLabel="Custom slippage tolerance"
    customSuffix="%"
    disabled={disabled}
    formatValue={formatValue}
    isValueAllowed={isValueAllowed}
    label="Slippage Tolerance"
    maxFractionDigits={2}
    maxIntegerDigits={3}
    onChange={onChange}
    options={SLIPPAGE_OPTIONS}
    value={value}
  />
)

export default PreparedActionSlippageControl
