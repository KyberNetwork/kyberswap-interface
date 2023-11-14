import { PageWrapper } from 'components/YieldPools/styleds'

import { FarmFilter, FarmList, SummaryUserFarm } from './components'
import { PageTitle } from './styled'

export default function OmniFarms() {
  return (
    <PageWrapper>
      <PageTitle>Farms</PageTitle>
      <SummaryUserFarm />
      <FarmFilter />
      <FarmList />
    </PageWrapper>
  )
}
