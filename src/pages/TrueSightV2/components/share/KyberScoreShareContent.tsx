import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Text } from 'rebass'

import Column from 'components/Column'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ITokenOverview } from 'pages/TrueSightV2/types'
import { calculateValueToColor, formatTokenPrice } from 'pages/TrueSightV2/utils'

import KyberScoreMeter from '../KyberScoreMeter'
import KyberScoreChart from '../chart/KyberScoreChart'

export default function KyberScoreShareContent({ token }: { token?: ITokenOverview }) {
  const theme = useTheme()
  if (!token) return null
  const latestKyberscore = token.kyberScore?.ks3d && token.kyberScore.ks3d[token.kyberScore.ks3d.length - 1]
  return (
    <Column width="100%" justify="center" gap="16px">
      <Text>
        <Trans>
          Calculated at {latestKyberscore ? dayjs(latestKyberscore?.created_at * 1000).format('HH:mm A, MMM DD') : ''}{' '}
          when price was {latestKyberscore ? '$' + formatTokenPrice(latestKyberscore.price) : '--'}
        </Trans>
      </Text>
      <KyberScoreMeter
        value={latestKyberscore?.kyber_score || 0}
        style={{ width: '380px', height: '236px', alignSelf: 'center' }}
      />
      <Row justify="center">
        <Text color={theme.text} fontSize="36px" lineHeight="44px">
          <Trans>
            {token?.symbol} seems to be{' '}
            <span style={{ color: calculateValueToColor(latestKyberscore?.kyber_score || 0, theme) }}>
              {latestKyberscore ? latestKyberscore.tag : ''}
            </span>
          </Trans>
        </Text>
      </Row>
      <Row justify="center">
        <KyberScoreChart index={1} data={token?.kyberScore?.ks3d} width="40%" height="46px" />
      </Row>
    </Column>
  )
}
