import Column from 'components/Column'

import { FundingRateTable } from '../table'

export default function FundingRateShareContent({ mobileMode }: { mobileMode?: boolean }) {
  return (
    <Column style={{ justifyContent: 'center', width: '100%', height: '100%' }} gap="16px">
      <FundingRateTable mobileMode={mobileMode} />
    </Column>
  )
}
