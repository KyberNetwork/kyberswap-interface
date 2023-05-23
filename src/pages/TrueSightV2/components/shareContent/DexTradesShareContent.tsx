import { useParams } from 'react-router-dom'

import Row from 'components/Row'
import { useLiveDexTradesQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'

import { LiveTradesInShareModalTable } from '../table'

export function DexTradesShareContent({ mobileMode }: { mobileMode?: boolean }) {
  const { chain, address } = useParams()
  const { data } = useLiveDexTradesQuery({
    chain,
    address,
  })

  return (
    <Row gap="16px" justify="space-between">
      {mobileMode ? (
        <LiveTradesInShareModalTable data={data?.slice(0, 10) || []} mobileMode />
      ) : (
        <>
          <LiveTradesInShareModalTable data={data?.slice(0, 5) || []} />
          <LiveTradesInShareModalTable data={data?.slice(5, 10) || []} />
        </>
      )}
    </Row>
  )
}
