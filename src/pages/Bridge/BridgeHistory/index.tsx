import styled from 'styled-components'

import TabSelector from './TabSelector'

type Props = {
  className?: string
}
const BridgeHistory: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <TabSelector />
    </div>
  )
}

export default styled(BridgeHistory)`
  flex: 1;
`
