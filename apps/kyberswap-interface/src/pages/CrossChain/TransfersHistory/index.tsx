import styled from 'styled-components'

import HistoryCrossChain from './History'

type Props = {
  className?: string
}

const BridgeHistory: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <HistoryCrossChain />
    </div>
  )
}

export default styled(BridgeHistory)`
  width: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 22px;
`
