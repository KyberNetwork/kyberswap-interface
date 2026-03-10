import { translateZapMessage } from '@kyber/ui'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityReviewData'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'

const WarningCard = styled(NoteCard)<{ $tone: 'info' | 'warning' | 'error' }>`
  background: ${({ theme, $tone }) =>
    $tone === 'error' ? `${theme.red}14` : $tone === 'warning' ? `${theme.warning}1f` : `${theme.primary}14`};
  border-color: ${({ theme, $tone }) =>
    $tone === 'error' ? `${theme.red}40` : $tone === 'warning' ? `${theme.warning}40` : `${theme.primary}26`};
`

interface AddLiquidityRouteInsightsProps {
  data?: AddLiquidityReviewData | null
  degenModeBlocked?: boolean
}

export default function AddLiquidityRouteInsights({ data, degenModeBlocked = false }: AddLiquidityRouteInsightsProps) {
  const warnings = data?.warnings || []

  if (warnings.length === 0 && !degenModeBlocked) return null

  return (
    <Stack gap={12}>
      {degenModeBlocked ? (
        <WarningCard $tone="error">
          To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if
          you still want to continue.
        </WarningCard>
      ) : null}

      {warnings.map((warning, index) => (
        <WarningCard key={`${warning.tone}-${index}`} $tone={warning.tone}>
          {translateZapMessage(warning.message)}
        </WarningCard>
      ))}
    </Stack>
  )
}
