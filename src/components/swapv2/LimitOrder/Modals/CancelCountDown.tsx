import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { Clock } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { formatRemainTime } from 'utils/time'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => rgba(theme.buttonBlack, 0.3)};
  border-radius: 16px;
  padding: 16px 12px;
  align-items: center;
`

const Timer = styled.div`
  color: ${({ theme }) => theme.red};
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

export default function CancelCountDown({ time }: { time: number }) {
  const theme = useTheme()
  // todo
  return (
    <Wrapper>
      <Text fontSize={'14px'} fontWeight={'400'} color={theme.text}>
        <Trans>Once submitted, the orders will be automatically cancelled in</Trans>
      </Text>
      <Timer>
        <Clock color={theme.red} size={16} /> <Text lineHeight={'20px'}>{formatRemainTime(time)}</Text>
      </Timer>
      <Text fontSize={'10px'} fontWeight={'400'} color={theme.subText}>
        *There is a possibility that the order might be filled before cancellation.{' '}
        <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
      </Text>
    </Wrapper>
  )
}
