import { AnimatePresence } from 'framer-motion'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'

import { EarnContentArea, EarnLayoutContainer } from 'pages/Earns/components/EarnLayout/styles'
import EarnSidebar, { EarnBreadcrumbs } from 'pages/Earns/components/EarnSidebar'
import { MobileDrawerOverlay, MobileDrawerPanel } from 'pages/Earns/components/EarnSidebar/styles'

const EARN_SIDEBAR_COLLAPSED_KEY = 'earn-sidebar-collapsed'

const readStoredCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(EARN_SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

const EarnLayout = ({ children }: { children?: ReactNode }) => {
  const isMobile = useMedia('(max-width: 992px)')
  const [collapsed, setCollapsed] = useState<boolean>(readStoredCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()

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

  const drawerVisible = isMobile && drawerOpen
  const drawerPortal = createPortal(
    <AnimatePresence>
      {drawerVisible && (
        <MobileDrawerOverlay
          key="earn-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleCloseDrawer}
        />
      )}
      {drawerVisible && (
        <MobileDrawerPanel
          key="earn-drawer-panel"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <EarnSidebar collapsed={false} inDrawer onToggle={handleCloseDrawer} onNavigate={handleCloseDrawer} />
        </MobileDrawerPanel>
      )}
    </AnimatePresence>,
    document.body,
  )

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
