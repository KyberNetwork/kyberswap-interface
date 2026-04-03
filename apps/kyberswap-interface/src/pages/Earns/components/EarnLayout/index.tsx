import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

import EarnSidebar, { EarnMobileNav } from 'pages/Earns/components/EarnSidebar'

import { EarnContentArea, EarnLayoutContainer } from './styles'

const EarnLayout = ({ children }: { children?: ReactNode }) => {
  return (
    <EarnLayoutContainer>
      <EarnSidebar />
      <EarnContentArea>
        <EarnMobileNav />
        {children ?? <Outlet />}
      </EarnContentArea>
    </EarnLayoutContainer>
  )
}

export default EarnLayout
