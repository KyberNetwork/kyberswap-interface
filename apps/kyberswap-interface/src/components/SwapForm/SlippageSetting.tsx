import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { useSearchParams } from 'react-router-dom'

import { ErrorWarning } from 'components/ErrorWarning'
import InfoHelper from 'components/InfoHelper'
import SlippageControl from 'components/SlippageControl'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOLATILITY } from 'constants/trade'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage, formatSlippage } from 'utils/slippage'

export const DropdownIcon = ({
  size,
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { size?: number }) => (
  <div
    {...rest}
    style={{ width: size || 12, height: size || 12, ...rest.style }}
    className={cn(
      'relative z-0 flex items-center justify-center overflow-visible rounded-full text-white2 transition-all duration-200 ease-in-out [&>svg]:relative [&>svg]:z-[1]',
      'data-[flip=true]:rotate-180',
      'data-[highlight=true]:text-primary',
      'data-[highlight=true]:after:pointer-events-none data-[highlight=true]:after:absolute data-[highlight=true]:after:-inset-px data-[highlight=true]:after:rounded-full data-[highlight=true]:after:bg-primary/25 data-[highlight=true]:after:content-[""]',
      'data-[highlight=true]:after:animate-[ks-slippage-highlight_1.4s_infinite_ease-out]',
      'data-[warning=true]:text-warning/90',
      className,
    )}
  >
    {children}
  </div>
)

/**
 * Grid placement for a setting that renders a compact header plus an expanding panel, where the two
 * belong in different cells. `header` and `panel` are the caller's placement classes.
 */
export type SettingGridCells = { header?: string; panel?: string }

type Props = {
  rightComponent?: ReactNode
  tooltip?: ReactNode
  slippageInfo?: {
    message: string
    isHigh: boolean
    isLow: boolean
    default: number
    presets: number[]
  }
  /**
   * Feature-local value. Without it the control reads and writes the global Swap setting, which is
   * wrong for a form that stores its own slippage on the order it creates.
   */
  slippage?: { value: number; onChange: (value: number) => void }
  /** Renders regardless of the Swap settings pin, for forms that own the control outright. */
  alwaysVisible?: boolean
  /**
   * Places the header and the expanding panel as separate cells of the caller's grid: the root stops
   * being a box (`display: contents`) so its two children become grid items directly. Lets a caller
   * keep a narrow header column while the panel, which needs more room than the column has, spans
   * the full grid width. Requires the caller to be a grid; leave unset everywhere else.
   */
  gridCells?: SettingGridCells
}
const SlippageSetting = ({ rightComponent, tooltip, slippageInfo, slippage, alwaysVisible, gridCells }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [expanded, setExpanded] = useState(false)
  const [isHighlight, setIsHighlight] = useState(false)
  const [triedSimulatedSlippage, setTriedSimulatedSlippage] = useState(false)
  const [isDegenMode] = useDegenModeManager()

  const {
    rawSlippage: globalSlippage,
    setRawSlippage: setGlobalSlippage,
    isSlippageControlPinned,
  } = useSlippageSettingByPage()
  const rawSlippage = slippage ? slippage.value : globalSlippage
  const setRawSlippage = slippage ? slippage.onChange : setGlobalSlippage

  const defaultSlippage = useDefaultSlippageByPair()
  const defaultSlp = slippageInfo ? slippageInfo.default : defaultSlippage

  const pairCategory = usePairCategory()
  const slippageStatus = slippageInfo
    ? slippageInfo.isHigh
      ? SLIPPAGE_STATUS.HIGH
      : slippageInfo.isLow
      ? SLIPPAGE_STATUS.LOW
      : SLIPPAGE_STATUS.NORMAL
    : checkRangeSlippage(rawSlippage, pairCategory)
  const isWarningSlippage = slippageInfo
    ? slippageInfo.isHigh || slippageInfo.isLow
    : slippageStatus !== SLIPPAGE_STATUS.NORMAL

  const msg = slippageInfo?.message ?? (SLIPPAGE_WARNING_MESSAGES[slippageStatus]?.[pairCategory] || '')

  const options = useMemo(
    () =>
      slippageInfo
        ? slippageInfo.presets
        : pairCategory === 'highVolatilityPair'
        ? DEFAULT_SLIPPAGES_HIGH_VOLATILITY
        : DEFAULT_SLIPPAGES,
    [pairCategory, slippageInfo],
  )

  // The deep link targets the Swap setting, so an instance holding its own value ignores it.
  const actionFromUrl = slippage ? null : searchParams.get('action')
  useEffect(() => {
    if (actionFromUrl === 'open-slippage-panel') {
      setExpanded(true)
      setTriedSimulatedSlippage(true)
      searchParams.delete('action')
      setSearchParams(searchParams)
      setIsHighlight(true)
      setTimeout(() => {
        setIsHighlight(false)
      }, 4000)
    }
  }, [actionFromUrl, searchParams, setSearchParams])

  if (!isSlippageControlPinned && !alwaysVisible) {
    return null
  }

  return (
    <div className={cn('flex w-full flex-col', gridCells && 'contents')} data-testid="slippage-setting">
      <div className={cn('flex items-center justify-between gap-1 text-subText', gridCells?.header)}>
        <div className="flex items-end gap-1">
          <span className="text-xs font-medium text-subText">
            <Trans>Max Slippage</Trans>:
          </span>
          <InfoHelper
            clickOnly
            margin={false}
            placement="top"
            text={
              tooltip || (
                <span>
                  <Trans>
                    During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                    <ExternalLink
                      href={
                        'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'
                      }
                    >
                      here ↗
                    </ExternalLink>
                  </Trans>
                </span>
              )
            }
          />
          <div
            role="button"
            onClick={() => setExpanded(e => !e)}
            data-testid="slippage-setting-toggle"
            className="flex cursor-pointer items-center gap-1 hover:brightness-[0.85]"
          >
            <span
              data-testid="slippage-value"
              className={cn('text-sm font-medium leading-none', isWarningSlippage ? 'text-warning' : 'text-text')}
            >
              {msg ? (
                <MouseoverTooltip text={slippageInfo ? msg : t`Your slippage ${msg}`}>
                  {formatSlippage(rawSlippage)}
                </MouseoverTooltip>
              ) : (
                formatSlippage(rawSlippage)
              )}
            </span>

            <DropdownIcon size={14} data-flip={expanded} data-highlight={!expanded && defaultSlp !== rawSlippage}>
              <ChevronDown size={14} />
            </DropdownIcon>
          </div>
        </div>
        {rightComponent}
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          // As a grid item the panel's automatic minimum size would hold the collapsed 0fr row open.
          gridCells && 'min-h-0',
          gridCells?.panel,
        )}
      >
        <div className={cn('min-h-0', isHighlight ? 'overflow-visible' : 'overflow-hidden')}>
          <Stack className="gap-3 pt-2">
            <Stack className="gap-1">
              <SlippageControl
                isHighlight={isHighlight}
                rawSlippage={rawSlippage}
                setRawSlippage={setRawSlippage}
                isWarning={isWarningSlippage}
                options={options}
              />
              {isDegenMode && expanded && (
                <span className="px-1 text-xs font-medium text-subText">
                  <Trans>Maximum slippage allowed for Degen mode is 50%</Trans>
                </span>
              )}
              {Math.abs(defaultSlp - rawSlippage) / defaultSlp > 0.2 && !triedSimulatedSlippage && (
                <div
                  role="button"
                  onClick={() => setRawSlippage(defaultSlp)}
                  className="flex w-fit cursor-pointer items-center gap-1 px-1 text-xs text-primary hover:brightness-125"
                >
                  <MouseoverTooltip text={<Trans>Dynamic entry based on trading pair.</Trans>} placement="bottom">
                    <span className="border-b border-dotted border-primary">
                      <Trans>Suggestion</Trans>
                    </span>
                  </MouseoverTooltip>
                  {(defaultSlp * 100) / 10_000}%
                </div>
              )}
            </Stack>

            {slippageInfo ? (
              msg && <ErrorWarning type="warn" title={msg} dataTestId="slippage-warning" />
            ) : (
              <SlippageWarningNote rawSlippage={rawSlippage} />
            )}
          </Stack>
        </div>
      </div>
    </div>
  )
}

export default SlippageSetting
