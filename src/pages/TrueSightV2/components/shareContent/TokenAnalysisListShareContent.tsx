import Row from 'components/Row'
import { ITokenList } from 'pages/TrueSightV2/types'

import { TokenListInShareModalTable } from '../table'

export default function TokenAnalysisListShareContent({ data }: { data: ITokenList[] }) {
  return (
    <Row gap="16px" justify="space-between">
      <TokenListInShareModalTable data={data.slice(0, 5)} />
      <TokenListInShareModalTable data={data.slice(5, 10)} />
    </Row>
  )
}
