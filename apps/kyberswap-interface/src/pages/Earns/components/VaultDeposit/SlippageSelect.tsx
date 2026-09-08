import { t } from '@lingui/macro'
import { useState } from 'react'
import { ChevronDown } from 'react-feather'

import { TextHelper } from 'components/Text'
import { cn } from 'utils/cn'
import { formatSlippage } from 'utils/slippage'

const PRESETS_BPS = [10, 50, 100] as const
const MAX_BPS = 2000
/** Digits with at most two decimals — the precision a basis-point slippage can carry. */
const SLIPPAGE_INPUT_REGEX = /^\d*\.?\d{0,2}$/

const toBps = (text: string) => Math.round(Number(text) * 100)

const isPreset = (bps: number): bps is (typeof PRESETS_BPS)[number] =>
  PRESETS_BPS.includes(bps as (typeof PRESETS_BPS)[number])

/**
 * Slippage the route is quoted with, in basis points. Expands in place — the same collapse the zap
 * flows use — so the options push the rest of the summary down instead of covering it.
 */
const SlippageSelect = ({ value, onChange }: { value: number; onChange: (bps: number) => void }) => {
  const [isExpanded, setExpanded] = useState(false)
  /** Raw text while the field is being edited, so a half-typed "1." survives the next keystroke. */
  const [custom, setCustom] = useState('')

  const isCustom = custom !== '' || !isPreset(value)

  const handleCustomChange = (raw: string) => {
    const next = raw.replace(/,/g, '.')
    if (next !== '' && !SLIPPAGE_INPUT_REGEX.test(next)) return

    setCustom(next)

    const bps = toBps(next)
    if (!next || !Number.isFinite(bps) || bps <= 0) return
    onChange(Math.min(bps, MAX_BPS))
  }

  // Reconcile the text with what is actually applied: a clamped or half-typed entry reads back as
  // the value the route is quoted with, and an entry that never resolved falls back to a preset.
  const handleCustomBlur = () => {
    if (custom === '') return

    const bps = toBps(custom)
    if (!Number.isFinite(bps) || bps <= 0) {
      setCustom('')
      onChange(PRESETS_BPS[1])
      return
    }

    setCustom(formatSlippage(Math.min(bps, MAX_BPS), false))
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent p-0 text-inherit"
      >
        <TextHelper
          tooltip={t`Applied to the swap this deposit or withdrawal routes through. A higher tolerance helps the transaction succeed, but you may get a worse price.`}
          placement="top"
          className="text-subText"
          fontSize={14}
        >
          {t`Max Slippage`}
        </TextHelper>
        <span className="flex items-center gap-1 text-sm leading-5 text-white">
          {formatSlippage(value)}
          <ChevronDown
            className={cn('size-4 text-subText transition-transform duration-200 ease-out', isExpanded && 'rotate-180')}
          />
        </span>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex items-stretch rounded-[20px] border border-solid border-border bg-background">
            {PRESETS_BPS.map(preset => (
              <button
                key={preset}
                type="button"
                tabIndex={isExpanded ? undefined : -1}
                onClick={() => {
                  setCustom('')
                  onChange(preset)
                }}
                className={cn(
                  'min-h-8 min-w-0 flex-1 cursor-pointer rounded-[20px] border-none px-2 text-sm',
                  value === preset && !isCustom
                    ? 'bg-tabActive font-medium text-text'
                    : 'bg-transparent font-normal text-subText hover:bg-buttonGray',
                )}
              >
                {formatSlippage(preset)}
              </button>
            ))}

            <div
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[20px] px-2',
                isCustom ? 'bg-tabActive text-text' : 'bg-transparent text-subText',
              )}
            >
              <input
                inputMode="decimal"
                value={custom}
                placeholder={t`Custom`}
                tabIndex={isExpanded ? undefined : -1}
                onChange={e => handleCustomChange(e.target.value)}
                onBlur={handleCustomBlur}
                className="w-14 min-w-0 border-none bg-transparent p-0 text-right text-[13px] font-medium text-inherit outline-none placeholder:text-inherit"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlippageSelect
