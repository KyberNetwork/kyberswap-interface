import AddLiquidity from 'pages/Earns/PoolDetail/AddLiquidity'
import PoolInformation from 'pages/Earns/PoolDetail/Information'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
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
