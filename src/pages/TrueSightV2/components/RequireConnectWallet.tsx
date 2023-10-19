import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import blur11d from 'assets/images/truesight-v2/blurred-charts/blur-1-1-dark.png'
import blur21d from 'assets/images/truesight-v2/blurred-charts/blur-2-1-dark.png'
// import blur12d from 'assets/images/truesight-v2/blurred-charts/blur-1-2-dark.png'
// import blur13d from 'assets/images/truesight-v2/blurred-charts/blur-1-3-dark.png'
import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

import { ChartTab } from '../types'

const StyledRequireConnectWalletWrapper = styled.div<{ bgUrl?: string; height?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: ${({ height }) => height || '100%'};
  border-radius: 10px;
  ${({ bgUrl }) => `background: url(${bgUrl});`}
  background-size: 100% 100%;
  background-position: center;
  filter: brightness(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
`

const getBlurredImageUrl = (chartType: number, tab: ChartTab) => {
  switch (chartType) {
    case 1: {
      switch (tab) {
        case ChartTab.First:
        case ChartTab.Second:
        case ChartTab.Third:
          return blur11d
      }
    }
    case 2: {
      switch (tab) {
        case ChartTab.First:
        case ChartTab.Second:
        case ChartTab.Third:
          return blur21d
      }
    }
  }
  return blur11d
}

export default function RequireConnectWalletWrapper({
  chartType,
  tab,
  height,
  children,
}: {
  chartType?: number
  tab?: ChartTab
  height?: string
  children: ReactNode
}) {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const bgUrl = chartType && tab !== undefined ? getBlurredImageUrl(chartType, tab) : ''
  if (!account)
    return (
      <StyledRequireConnectWalletWrapper bgUrl={bgUrl} height={height}>
        <Text color={theme.text}>
          <Trans>Connect your wallet to view this insight</Trans>
        </Text>
        <ButtonPrimary
          onClick={toggleWalletModal}
          width="138px"
          height="36px"
          style={{ boxShadow: '0 2px 4px 2px #00000030' }}
        >
          <Trans>Connect</Trans>
        </ButtonPrimary>
      </StyledRequireConnectWalletWrapper>
    )
  return <>{children}</>
}
