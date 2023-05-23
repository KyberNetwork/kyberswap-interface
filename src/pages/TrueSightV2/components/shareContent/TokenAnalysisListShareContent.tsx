import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useTheme } from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import { ITokenList, KyberAIListType } from 'pages/TrueSightV2/types'

import { TokenListInShareModalTable } from '../table'

const mapTypeTitle = {
  [KyberAIListType.ALL]: t`Top All Tokens`,
  [KyberAIListType.MYWATCHLIST]: t`My Watchlist`,
  [KyberAIListType.BULLISH]: t`Top Bullish Tokens`,
  [KyberAIListType.BEARISH]: t`Top Bearish Tokens`,
  [KyberAIListType.TOP_CEX_INFLOW]: t`Top CEX Positive Netflow Tokens`,
  [KyberAIListType.TOP_CEX_OUTFLOW]: t`Top CEX Negative Netflow Tokens`,
  [KyberAIListType.TOP_TRADED]: t`Top Trade Tokens`,
  [KyberAIListType.TOP_SOCIAL]: t`Top Social Tokens`,
  [KyberAIListType.TRENDING_SOON]: t`Trending Soon Tokens`,
  [KyberAIListType.TRENDING]: t`Top Trending Tokens`,
}

export default function TokenAnalysisListShareContent({
  data,
  mobileMode,
}: {
  data: ITokenList[]
  mobileMode?: boolean
}) {
  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const listType = (searchParams.get('listType') as KyberAIListType) || KyberAIListType.BULLISH
  const title = listType ? mapTypeTitle[listType] : ''
  return (
    <Column gap="20px">
      <Text fontSize="26px">{title}</Text>
      <Text fontSize="16px">
        <Trans>
          Today, <span style={{ color: theme.subText }}>{dayjs(Date.now()).format('DD/MM/YYYY')}</span>
        </Trans>
      </Text>
      <Row gap="22px" justify="space-between">
        {mobileMode ? (
          <>
            <TokenListInShareModalTable data={data.slice(0, 10)} startIndex={0} mobileMode />
          </>
        ) : (
          <>
            <TokenListInShareModalTable data={data.slice(0, 5)} startIndex={0} />
            {data.length > 5 && <TokenListInShareModalTable data={data.slice(5, 10)} startIndex={5} />}
          </>
        )}
      </Row>
    </Column>
  )
}
