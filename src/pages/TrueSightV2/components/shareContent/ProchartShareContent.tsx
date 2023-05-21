import styled from 'styled-components'

import { Prochart } from '../chart'

const Wrapper = styled.div`
  width: 100%;
  .js-rootresizer__contents {
    zoom: 0.8;
  }
`
export default function ProchartShareContent({ isBTC }: { isBTC?: boolean }) {
  return (
    <Wrapper>
      <Prochart isBTC={isBTC} />
    </Wrapper>
  )
}
