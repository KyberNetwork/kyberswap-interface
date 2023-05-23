import styled from 'styled-components'

import Column from 'components/Column'

import { FundingRateTable } from '../table'

const ChartImage = styled.div`
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
`
export default function FundingRateShareContent({ dataUrl, mobileMode }: { dataUrl?: string; mobileMode?: boolean }) {
  return (
    <Column style={{ justifyContent: 'center', width: '100%', height: '100%' }} gap="16px">
      <ChartImage
        style={{
          backgroundImage: `url(${dataUrl})`,
        }}
      />
      <FundingRateTable mobileMode={mobileMode} />
    </Column>
  )
}
