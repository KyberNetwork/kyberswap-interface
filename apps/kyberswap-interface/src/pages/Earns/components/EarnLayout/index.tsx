import { ReactNode, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { EARN_SIDEBAR_COLLAPSED_KEY, readStoredSidebarCollapsed } from 'pages/Earns/components/EarnLayout/constants'
import { EarnContentArea, EarnLayoutContainer } from 'pages/Earns/components/EarnLayout/styles'
import EarnSidebar, { EarnBreadcrumbs } from 'pages/Earns/components/EarnSidebar'
import { MobileDrawerOverlay, MobileDrawerPanel } from 'pages/Earns/components/EarnSidebar/styles'

const EarnLayout = ({ children }: { children?: ReactNode }) => {
  const isMobile = useMedia('(max-width: 992px)')
  const [collapsed, setCollapsed] = useState<boolean>(readStoredSidebarCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMounted(true), [])

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      try {
        window.localStorage.setItem(EARN_SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        /* ignore write errors (private mode / quota) */
      }
      return next
    })
  }, [])

  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), [])
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  // Portals need a real document.body, which prerendering doesn't have. The drawer itself stays
  // mounted for as long as the layout is on a narrow screen and slides in and out on its `$open`
  // state, so nothing about it depends on an animation running to completion.
  const drawerPortal =
    mounted && isMobile
      ? createPortal(
          <>
            <MobileDrawerOverlay $open={drawerOpen} onClick={handleCloseDrawer} />
            <MobileDrawerPanel $open={drawerOpen}>
              <EarnSidebar collapsed={false} inDrawer onToggle={handleCloseDrawer} onNavigate={handleCloseDrawer} />
            </MobileDrawerPanel>
          </>,
          document.body,
        )
      : null

  return (
    <EarnLayoutContainer>
      {!isMobile && <EarnSidebar collapsed={collapsed} onToggle={handleToggleCollapsed} />}
      <EarnContentArea>
        <EarnBreadcrumbs onOpenDrawer={handleOpenDrawer} />
        {children ?? <Outlet />}
      </EarnContentArea>
      {drawerPortal}
    </EarnLayoutContainer>
  )
}

export default EarnLayout
