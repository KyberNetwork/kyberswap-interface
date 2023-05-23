import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'

const ChartImage = styled.div`
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
`
export default function ProchartShareContent({ title, dataUrl }: { title: string; dataUrl?: string }) {
  return (
    <Column style={{ justifyContent: 'center', width: '100%', height: '100%' }} gap="16px">
      <Text fontSize="24px">{title}</Text>
      <ChartImage
        style={{
          backgroundImage: `url(${dataUrl})`,
        }}
      />
    </Column>
  )
}
