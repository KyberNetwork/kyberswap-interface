import type { PropsWithChildren } from 'react'
import { ChevronRight, Sidebar as SidebarIcon } from 'react-feather'
import { Link } from 'react-router-dom'

import IconButton from 'components/Button/IconButton'
import Drawer from 'components/Modal/Drawer'
import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

export type BreadcrumbItem = { label: string; to?: string }

type MobileNavigationProps = PropsWithChildren<{
  breadcrumbs: BreadcrumbItem[]
  isOpen: boolean
  onDismiss: () => void
  onOpen: () => void
}>

const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <HStack
    as="ol"
    aria-label="Breadcrumb"
    className="min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm font-medium"
  >
    {items.map(({ label, to }, index) => {
      const current = index === items.length - 1
      const clickable = !!to && !current
      const labelClassName = cn(
        'whitespace-nowrap no-underline',
        current ? 'text-text' : 'text-subText',
        clickable && 'hover:text-primary',
      )

      return (
        <li key={`${label}-${index}`} className="flex shrink-0 items-center gap-1">
          {index > 0 && <ChevronRight size={16} className="shrink-0 text-subText" aria-hidden />}
          {clickable ? (
            <Link to={to} className={labelClassName} title={label}>
              {label}
            </Link>
          ) : (
            <span className={labelClassName} title={label}>
              {label}
            </span>
          )}
        </li>
      )
    })}
  </HStack>
)

const MobileNavigation = ({ breadcrumbs, children, isOpen, onDismiss, onOpen }: MobileNavigationProps) => (
  <nav
    aria-label="Copy Trading"
    className="hidden bg-black px-4 py-2 max-lg:sticky max-lg:top-0 max-lg:z-[100] max-lg:block"
  >
    <HStack className="min-w-0 items-center gap-2.5">
      <Drawer
        title="Copy Trading"
        trigger={
          <IconButton
            aria-expanded={isOpen}
            aria-label="Open Copy Trading menu"
            onClick={onOpen}
            className="rounded-lg bg-buttonBlack text-subText hover:bg-primary-10 hover:text-primary"
            variant="action"
          >
            <SidebarIcon size={18} aria-hidden />
          </IconButton>
        }
        isOpen={isOpen}
        onDismiss={onDismiss}
        width="min(320px, 85vw)"
        className="!absolute !left-0 !top-0 !m-0 !h-dvh !max-h-none !overflow-y-auto !rounded-none !bg-background !p-4 !shadow-[10px_0_28px_rgba(0,0,0,0.5)]"
      >
        <div
          onClick={event => {
            if ((event.target as HTMLElement).closest('a')) onDismiss()
          }}
        >
          {children}
        </div>
      </Drawer>

      <Breadcrumbs items={breadcrumbs} />
    </HStack>
  </nav>
)

export default MobileNavigation
