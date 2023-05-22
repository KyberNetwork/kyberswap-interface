import styled from 'styled-components'

import Column from 'components/Column'

import { SupportResistanceLevel } from '../table'

const ChartImage = styled.div`
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
`
export default function SupportResistanceShareContent({ dataUrl }: { dataUrl?: string }) {
  return (
    <Column style={{ justifyContent: 'center', width: '100%' }} gap="16px">
      <ChartImage
        style={{
          backgroundImage: `url(${dataUrl})`,
        }}
      />
      <SupportResistanceLevel />
    </Column>
  )
}
