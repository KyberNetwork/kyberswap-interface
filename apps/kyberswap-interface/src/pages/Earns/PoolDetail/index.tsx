import { useEffect } from 'react'

import AddLiquidity from 'pages/Earns/PoolDetail/AddLiquidity'
import PoolInformation from 'pages/Earns/PoolDetail/Information'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import { PoolDetailProvider, usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { formatDisplayNumber } from 'utils/numbers'

// Upgrade the generic seoConfig <title> to a per-pool one (tokens + fee) once pool data loads. Lives
// inside the provider, which renders children only after the pool resolves, so the context is ready.
// RouteSeo sets the generic title on navigation; this overrides it, and RouteSeo resets it on the
// next route — no cleanup needed.
const PoolSeoTitle = () => {
  const { primaryToken, secondaryToken, pool } = usePoolDetailContext()
  const token0 = primaryToken?.symbol
  const token1 = secondaryToken?.symbol
  const fee = pool?.swapFee

  useEffect(() => {
    if (!token0 || !token1) return
    // Format the fee like PoolHeader does (raw swapFee can carry float noise, e.g. 0.30000000000004).
    const feeText = typeof fee === 'number' ? ` ${formatDisplayNumber(fee, { significantDigits: 4 })}%` : ''
    document.title = `${token0}/${token1}${feeText} Pool | KyberSwap`
  }, [token0, token1, fee])

  return null
}

const PoolDetailPage = () => {
  return (
    <PoolDetailProvider>
      <PoolSeoTitle />
      <PoolDetailWrapper>
        <PoolHeader />
        <AddLiquidity>
          <PoolInformation />
        </AddLiquidity>
      </PoolDetailWrapper>
    </PoolDetailProvider>
  )
}

export default PoolDetailPage
