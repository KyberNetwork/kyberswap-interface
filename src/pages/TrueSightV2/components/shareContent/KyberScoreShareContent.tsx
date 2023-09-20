import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Text } from 'rebass'

import Column from 'components/Column'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'
import { IAssetOverview } from 'pages/TrueSightV2/types'
import { formatTokenPrice, getColorByKyberScore } from 'pages/TrueSightV2/utils'

import KyberScoreMeter from '../KyberScoreMeter'
import KyberScoreChart from '../chart/KyberScoreChart'

export default function KyberScoreShareContent({
  token,
  mobileMode,
}: {
  token?: IAssetOverview
  mobileMode?: boolean
}) {
  const theme = useTheme()
  if (!token) return null
  const latestKyberscore = token.kyberScore?.ks3d && token.kyberScore.ks3d[token.kyberScore.ks3d.length - 1]
  return (
    <Column width="100%" justify="center" gap={mobileMode ? '28px' : '16px'}>
      <Text fontSize={mobileMode ? '14px' : '16px'}>
        <Trans>
          Calculated at {latestKyberscore ? dayjs(latestKyberscore?.created_at * 1000).format('HH:mm A, MMM DD') : ''}{' '}
          when price was {latestKyberscore ? '$' + formatTokenPrice(latestKyberscore.price) : '--'}
        </Trans>
      </Text>
      <KyberScoreMeter
        value={latestKyberscore?.kyber_score || 0}
        style={{ width: mobileMode ? '250px' : '380px', height: mobileMode ? '135px' : '236px', alignSelf: 'center' }}
        noAnimation={true}
      />
      <Row justify="center">
        <Text color={theme.text} fontSize={mobileMode ? '20px' : '36px'} lineHeight={mobileMode ? '28px' : '44px'}>
          <Trans>
            {token?.symbol?.toUpperCase()} seems to be{' '}
            <span style={{ color: getColorByKyberScore(latestKyberscore?.kyber_score || 0, theme) }}>
              {latestKyberscore ? latestKyberscore.tag : ''}
            </span>
          </Trans>
        </Text>
      </Row>
      <Row justify="center">
        <KyberScoreChart
          index={1}
          data={token?.kyberScore?.ks3d}
          width={mobileMode ? '80%' : '40%'}
          height={mobileMode ? '40px' : '46px'}
          noAnimation
        />
      </Row>
    </Column>
  )
}
