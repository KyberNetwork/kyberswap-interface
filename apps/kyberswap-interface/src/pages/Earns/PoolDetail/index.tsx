import AddLiquidity from './components/AddLiquidity'
import PoolHeader from './components/PoolHeader'
import PoolInformation from './components/PoolInformation'
import { PoolDetailWrapper } from './styled'

const PoolDetail = () => {
  return (
    <PoolDetailWrapper>
      <PoolHeader />
      <AddLiquidity>
        <PoolInformation />
      </AddLiquidity>
    </PoolDetailWrapper>
  )
}

export default PoolDetail
