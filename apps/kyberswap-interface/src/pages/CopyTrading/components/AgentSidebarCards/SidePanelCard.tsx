import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'

import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export type SidePanelCardProps = PropsWithChildren<{
  bodyClassName?: string
  collapsible?: boolean
  headerRight?: ReactNode
  initialExpanded?: boolean
  title?: ReactNode
}>

export type SidePanelCardWrapperProps = Omit<SidePanelCardProps, 'children'>

export const SidePanelCard = ({
  bodyClassName,
  children,
  collapsible,
  headerRight,
  initialExpanded = true,
  title,
}: SidePanelCardProps) => {
  const [expanded, setExpanded] = useState(initialExpanded)
  const hasBody = children !== undefined && children !== null && children !== false

  if (collapsible && title && hasBody) {
    return (
      <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
        <button
          type="button"
          aria-expanded={expanded}
          className={cn(
            'w-full border-b px-4 py-3 text-left outline-none hover:bg-white-04',
            expanded ? 'border-darkBorder' : 'border-transparent',
          )}
          onClick={() => setExpanded(value => !value)}
        >
          <HStack className="items-center justify-between gap-4">
            <h3 className="min-w-0 text-base font-medium text-text">{title}</h3>
            <HStack className="shrink-0 items-center gap-1">
              {headerRight}
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </HStack>
          </HStack>
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Stack className={cn('gap-3 px-4 py-3', bodyClassName)}>{children}</Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
    )
  }

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
      {title && (
        <h3
          className={cn(
            'border-b px-4 py-3 text-base font-medium text-text',
            hasBody ? 'border-darkBorder' : 'border-transparent',
          )}
        >
          {headerRight ? (
            <HStack as="span" className="items-center justify-between gap-4">
              <span className="min-w-0">{title}</span>
              <span className="shrink-0">{headerRight}</span>
            </HStack>
          ) : (
            title
          )}
        </h3>
      )}
      {hasBody && <Stack className={cn('gap-3 px-4 py-3', bodyClassName)}>{children}</Stack>}
    </Stack>
  )
}
