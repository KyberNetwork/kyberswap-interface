import AddLiquidity from 'pages/Earns/PoolDetail/AddLiquidity'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import PoolInformation from 'pages/Earns/PoolDetail/components/PoolInformation'
import { PoolDetailProvider } from 'pages/Earns/PoolDetail/context'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'

const PoolDetailPage = () => {
  return (
    <PoolDetailProvider>
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
