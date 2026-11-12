import { ButtonHTMLAttributes, PropsWithChildren, ReactNode, useEffect, useId, useRef, useState } from 'react'

import { cn } from 'utils/cn'

export type CollapseTriggerProps = {
  /** Current resolved state, for labels and chevrons. */
  open: boolean
  /** Spread onto a native button; includes type, click handler and ARIA linkage. */
  buttonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick' | 'aria-expanded' | 'aria-controls'>
}

export type CollapseProps = PropsWithChildren<{
  /** Controlled state. When supplied, the parent must apply changes from onOpenChange. */
  open?: boolean
  /** Initial uncontrolled state; later changes are ignored. Defaults to false. */
  defaultOpen?: boolean
  /** Called once per trigger activation with the requested state, never on prop changes. */
  onOpenChange?: (open: boolean) => void
  /** Optional trigger rendered before the panel. Omit when an external control owns open. */
  trigger?: (props: CollapseTriggerProps) => ReactNode
  /** Panel ID for external aria-controls; generated automatically when omitted. */
  id?: string
  /** Animated panel styles. Use contentGap for spacing and keep borders inside children. */
  className?: string
  /** Clipping wrapper styles. Avoid padding here; use overflow-visible only for content that must escape when open. */
  contentClassName?: string
  /** Content spacing in 4px units (2 = 8px). Applied as inner top padding so it collapses fully. Defaults to 0. */
  contentGap?: number
  /** Fade alongside height. Disable for surfaces that only animate height. Defaults to true. */
  fade?: boolean
  /** Unmount after closing finishes, for expensive content such as charts. Defaults to false. */
  unmountOnExit?: boolean
}>

/**
 * Vertical disclosure with controlled or uncontrolled state and a 200ms CSS grid transition.
 * No height measurement or arbitrary max-height is needed. Reduced-motion
 * preferences disable transitions. Closed content is inert and hidden from assistive technology.
 * Children stay mounted by default to preserve input and component state.
 * Keep the control mode stable for the lifetime of the component.
 *
 * @example Controlled content with an existing external button:
 * <Collapse open={showDetails} contentGap={2}><Details /></Collapse>
 *
 * @example Uncontrolled disclosure with an accessible trigger:
 * <Collapse defaultOpen trigger={({ buttonProps }) => <button {...buttonProps}>Details</button>}>
 *   <Details />
 * </Collapse>
 */
export const Collapse = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger,
  children,
  id,
  className,
  contentClassName,
  contentGap = 0,
  fade = true,
  unmountOnExit = false,
}: CollapseProps) => {
  const generatedId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const open = controlledOpen ?? uncontrolledOpen
  const panelId = id ?? generatedId
  const panelRef = useRef<HTMLDivElement>(null)
  const [present, setPresent] = useState(open)

  useEffect(() => {
    if (!unmountOnExit) return
    if (open) {
      setPresent(true)
      return
    }
    if (!present || !panelRef.current) return

    // A fallback also cleans up hidden panels, which do not dispatch transitionend.
    // Read the actual CSS duration so overrides and reduced motion stay in sync.
    const style = getComputedStyle(panelRef.current)
    const toMilliseconds = (value: string) => parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000) || 0
    const durations = style.transitionDuration.split(',').map(toMilliseconds)
    const delays = style.transitionDelay.split(',').map(toMilliseconds)
    const duration = Math.max(...durations.map((value, index) => value + delays[index % delays.length]))
    if (!duration) {
      setPresent(false)
      return
    }
    const timer = window.setTimeout(() => setPresent(false), duration + 50)
    return () => window.clearTimeout(timer)
  }, [open, present, unmountOnExit])

  const handleToggle = () => {
    const nextOpen = !open
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <>
      {trigger?.({
        open,
        buttonProps: {
          type: 'button',
          onClick: handleToggle,
          'aria-expanded': open,
          'aria-controls': panelId,
        },
      })}
      <div
        ref={panelRef}
        id={panelId}
        data-state={open ? 'open' : 'closed'}
        aria-hidden={!open}
        inert={!open}
        onTransitionEnd={event => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === 'grid-template-rows' &&
            !open &&
            unmountOnExit
          ) {
            setPresent(false)
          }
        }}
        className={cn(
          'grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          fade && (open ? 'opacity-100' : 'opacity-0'),
          className,
        )}
      >
        <div className={cn('min-h-0 overflow-hidden', contentClassName, !open && 'overflow-hidden')}>
          {!unmountOnExit || open || present ? <div style={{ paddingTop: contentGap * 4 }}>{children}</div> : null}
        </div>
      </div>
    </>
  )
}
