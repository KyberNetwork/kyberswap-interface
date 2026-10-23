import { Trans } from '@lingui/macro'

import { ReactComponent as RouteIcon } from 'assets/svg/route_icon.svg'

/** Keep the trigger's geometry identical before and after the quote engine loads. */
export const CrossChainRoutesButton = ({
  disabled,
  expanded,
  onClick,
}: {
  disabled?: boolean
  expanded?: boolean
  onClick?: () => void
}) => (
  <button
    type="button"
    disabled={disabled}
    aria-expanded={expanded}
    onClick={onClick}
    className="flex min-h-5 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border-0 bg-subText/[0.08] px-2 py-1 text-xs font-medium leading-5 text-subText enabled:cursor-pointer enabled:hover:bg-subText/[0.12] disabled:cursor-default"
  >
    <RouteIcon className="size-3.5 shrink-0" />
    <Trans>Routes</Trans>
  </button>
)
