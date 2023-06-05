import { useParams } from 'react-router-dom'

import Row from 'components/Row'
import { useHolderListQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'

import { Top10HoldersShareModalTable } from '../table'

export function Top10HoldersShareContent({ mobileMode }: { mobileMode?: boolean }) {
  const { chain, address } = useParams()
  const { data } = useHolderListQuery({
    chain,
    address,
  })

  return (
    <Row gap="16px" justify="space-between">
      {mobileMode ? (
        <Top10HoldersShareModalTable data={data?.slice(0, 10) || []} mobileMode />
      ) : (
        <>
          <Top10HoldersShareModalTable data={data?.slice(0, 5) || []} />
          <Top10HoldersShareModalTable data={data?.slice(5, 10) || []} startIndex={5} />
        </>
      )}
    </Row>
  )
}
