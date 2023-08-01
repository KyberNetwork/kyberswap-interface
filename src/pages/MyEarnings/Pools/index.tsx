import { Flex } from 'rebass'

import { VERSION } from 'constants/v2'
import ClassicElasticTab from 'pages/MyEarnings/ClassicElasticTab'
import ElasticPools from 'pages/MyEarnings/ElasticPools'
import PoolFilteringBar from 'pages/MyEarnings/PoolFilteringBar'
import { useAppSelector } from 'state/hooks'

const Pools = () => {
  const activeTab = useAppSelector(state => state.myEarnings.activeTab)

  const renderPools = () => {
    if (activeTab === VERSION.ELASTIC || activeTab === VERSION.ELASTIC_LEGACY) {
      return <ElasticPools />
    }

    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <ClassicElasticTab />
      <PoolFilteringBar />
      {renderPools()}
    </Flex>
  )
}

export default Pools
