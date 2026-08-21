import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

import { Center, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { cn } from 'utils/cn'

export const getSidebarRouteState = (pathname: string) => {
  const isLeaderboardPage = pathname === APP_PATHS.COPY_TRADING
  const isCopiesPage = pathname.startsWith(APP_PATHS.COPY_TRADING + '/my-copies')
  const isCopyDetailPage = pathname.startsWith(APP_PATHS.COPY_TRADING + '/my-copies/')
  const isHistoryPage = pathname === APP_PATHS.COPY_TRADING + '/history'
  const isHistoryDetailPage = pathname.startsWith(APP_PATHS.COPY_TRADING + '/history/')
  const activeAgentCode = pathname.replace(APP_PATHS.COPY_TRADING + '/', '').split('/')[0]
  const isAgentProfilePage =
    pathname.startsWith(APP_PATHS.COPY_TRADING + '/') && !isCopiesPage && !isHistoryPage && !isHistoryDetailPage

  return {
    activeAgentCode,
    activeCopyId: isCopyDetailPage ? pathname.split('/').at(-1) || '' : '',
    isAgentsPage: isLeaderboardPage || isAgentProfilePage,
    isCopiesPage,
    isHistoryPage,
    isHistorySectionActive: isHistoryPage || isHistoryDetailPage,
    isMyCopiesSectionActive: isCopiesPage || isHistoryPage || isHistoryDetailPage,
  }
}

export type SidebarRouteState = ReturnType<typeof getSidebarRouteState>

type SidebarSectionProps = PropsWithChildren<{
  title: string
  active?: boolean
  count?: number
  onClick?: () => void
  to?: string
}>

export const SidebarSection = ({ title, active, count, children, onClick, to }: SidebarSectionProps) => {
  return (
    <Stack className="gap-1">
      {to ? (
        <div
          className={cn(
            'h-9 rounded-lg border-l-2 border-transparent hover:bg-primary-10',
            active && 'border-primary bg-primary-12 text-primary',
          )}
        >
          <Link
            to={to}
            onClick={onClick}
            className={cn(
              'flex size-full items-center justify-between pl-2.5 pr-3 text-left text-xs font-semibold uppercase no-underline hover:text-primary',
              active ? 'text-primary' : 'text-subText',
            )}
          >
            <span>{title}</span>
            {typeof count === 'number' && (
              <Center className="size-5 rounded-full bg-primary-12 text-xs font-medium text-primary">{count}</Center>
            )}
          </Link>
        </div>
      ) : (
        <div
          className={cn(
            'flex h-8 items-center justify-between rounded-lg border-l-2 border-transparent pl-2.5 pr-3 text-xs font-semibold uppercase text-subText',
            active && 'bg-white-08',
          )}
        >
          <span>{title}</span>
          {typeof count === 'number' && (
            <Center className="size-5 rounded-full bg-primary-12 text-xs font-medium text-primary">{count}</Center>
          )}
        </div>
      )}
      {children}
    </Stack>
  )
}

type SidebarMenuItemProps = PropsWithChildren<{
  to?: string
  active?: boolean
  onClick?: () => void
  activeStyle?: 'surface' | 'text'
  layout?: 'default' | 'between' | 'row'
  colorByActive?: boolean
}>

export const SidebarMenuItem = ({
  to,
  active,
  children,
  onClick,
  activeStyle = 'surface',
  layout = 'default',
  colorByActive,
}: SidebarMenuItemProps) => {
  const className = cn(
    'flex size-full items-center pl-2.5 pr-3 text-left font-medium no-underline',
    layout === 'between' && 'justify-between',
    layout === 'row' && 'gap-3',
    colorByActive && 'text-sm hover:text-primary',
    colorByActive && (active ? 'text-primary' : 'text-subText'),
  )

  return (
    <div
      className={cn(
        'h-9 rounded-lg border-l-2 border-transparent hover:bg-primary-10',
        active && activeStyle === 'surface' && 'border-primary bg-primary-12 text-primary',
        active && activeStyle === 'text' && 'text-primary',
      )}
    >
      {to ? (
        <Link to={to} onClick={onClick} className={className}>
          {children}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {children}
        </button>
      )}
    </div>
  )
}
